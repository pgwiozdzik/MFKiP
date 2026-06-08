package zti.backend.controller;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import zti.backend.model.Performance;
import zti.backend.repository.PerformanceRepository;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * REST controller responsible for managing festival performances.
 * <p>
 * This controller provides comprehensive endpoints for CRUD operations on performances,
 * including status updates and schedule reordering. It also integrates with WebSocket
 * messaging to broadcast real-time updates to connected clients whenever the schedule changes.
 * </p>
 */
@RestController
@RequestMapping("/api/performances")
@CrossOrigin(origins = "${app.frontend.url}")
public class PerformanceController {

    /**
     * Repository for performing database operations related to the {@link Performance} entity.
     */
    @Autowired
    private PerformanceRepository performanceRepository;

    /**
     * Template for sending STOMP messages over WebSockets.
     * Used to notify the frontend about data changes in real-time.
     */
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Retrieves all performances stored in the database.
     *
     * @return a {@link List} of all {@link Performance} entities, sorted according to repository logic
     */
    @GetMapping("/all")
    public List<Performance> getAllPerformances() {
        return performanceRepository.findAllSorted();
    }

    /**
     * Updates only the status of a specific performance.
     *
     * @param id      the unique identifier of the performance
     * @param payload a map containing the new status value under the "status" key
     * @return a {@link ResponseEntity} containing the updated performance, or 404 Not Found if it doesn't exist
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Performance> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Optional<Performance> optionalPerformance = performanceRepository.findById(id);

        if (optionalPerformance.isPresent()) {
            Performance performance = optionalPerformance.get();
            String newStatus = payload.get("status");

            performance.setStatus(newStatus);

            Performance updated = performanceRepository.save(performance);

            // Broadcast the change to all connected WebSocket clients to refresh their views
            messagingTemplate.convertAndSend("/topic/performances", "UPDATE");

            return ResponseEntity.ok(updated);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Retrieves all performances scheduled for a specific festival day.
     *
     * @param dayId the unique identifier of the active festival day
     * @return a {@link List} of performances assigned to the specified day, ordered chronologically
     */
    @GetMapping("/day/{dayId}")
    public List<Performance> getPerformancesByDay(@PathVariable Long dayId) {
        return performanceRepository.findByDayIdOrderByPlannedStartTimeAsc(dayId);
    }

    /**
     * Adds a new performance (or a scheduled break) to the database.
     *
     * @param performance the {@link Performance} object containing the new entry's details
     * @return a {@link ResponseEntity} containing the saved entity, or 500 Internal Server Error upon failure
     */
    @PostMapping("/add")
    public ResponseEntity<?> addPerformance(@RequestBody Performance performance) {
        try {
            System.out.println("Otrzymano występ: " + performance.getPerformerName());

            Performance saved = performanceRepository.save(performance);

            // Broadcast the addition to trigger frontend table re-renders
            messagingTemplate.convertAndSend("/topic/performances", "UPDATE");

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace(); // Logs the exact error trace to the server console
            return ResponseEntity.status(500).body("Błąd serwera: " + e.getMessage());
        }
    }

    /**
     * Completely updates an existing performance with new details.
     *
     * @param id                 the unique identifier of the performance to update
     * @param performanceDetails the {@link Performance} object containing updated fields
     * @return a {@link ResponseEntity} containing the updated entity, 404 Not Found, or 500 on database error
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePerformance(@PathVariable Long id, @RequestBody Performance performanceDetails) {
        return performanceRepository.findById(id).map(performance -> {
            try {
                System.out.println("Edycja występu o ID: " + id);

                // Update core entity attributes
                performance.setPerformerName(performanceDetails.getPerformerName());
                performance.setPlannedStartTime(performanceDetails.getPlannedStartTime());
                performance.setStatus(performanceDetails.getStatus());
                performance.setBreak(performanceDetails.isBreak());
                performance.setActualStartTime(performanceDetails.getActualStartTime());

                if (performanceDetails.getChangedStartTime() != null) {
                    performance.setChangedStartTime(performanceDetails.getChangedStartTime());
                }

                // Safely update or detach the assigned volunteer
                if (performanceDetails.getVolunteer() != null && performanceDetails.getVolunteer().getId() != null) {
                    performance.setVolunteer(performanceDetails.getVolunteer());
                } else {
                    performance.setVolunteer(null);
                }

                Performance updated = performanceRepository.save(performance);

                // Notify clients of the comprehensive edit
                messagingTemplate.convertAndSend("/topic/performances", "UPDATE");

                return ResponseEntity.ok(updated);
            } catch (Exception e) {
                e.printStackTrace();
                return ResponseEntity.status(500).body("Błąd bazy danych: " + e.getMessage());
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Reorders a performance by swapping its start time with an adjacent performance.
     * <p>
     * This method utilizes transaction management to ensure both performances are updated
     * simultaneously. It calculates the effective time (changed or planned) and swaps them
     * based on the provided direction.
     * </p>
     *
     * @param id      the unique identifier of the performance being moved
     * @param payload a map containing the "direction" key (either "up" or "down")
     * @return a {@link ResponseEntity} indicating success, 400 Bad Request if movement is invalid, or 404
     */
    @PatchMapping("/{id}/reorder")
    @Transactional
    public ResponseEntity<?> reorderPerformance(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String direction = payload.get("direction");

        return performanceRepository.findById(id).map(current -> {
            // Fetch all performances for the active day to establish the current order
            List<Performance> dayPerformances = performanceRepository.findAllByDayIdSorted(current.getDay().getId());

            // Sort them purely by effective start time (falling back to planned time if changed is null)
            dayPerformances.sort((a, b) -> {
                LocalTime tA = a.getChangedStartTime() != null ? a.getChangedStartTime() : a.getPlannedStartTime();
                LocalTime tB = b.getChangedStartTime() != null ? b.getChangedStartTime() : b.getPlannedStartTime();
                return tA.compareTo(tB);
            });

            int currentIndex = dayPerformances.indexOf(current);
            Performance target = null;

            // Determine the target performance to swap with based on boundaries
            if ("up".equals(direction) && currentIndex > 0) {
                target = dayPerformances.get(currentIndex - 1);
            } else if ("down".equals(direction) && currentIndex < dayPerformances.size() - 1) {
                target = dayPerformances.get(currentIndex + 1);
            }

            // Perform the time swap if a valid target was found
            if (target != null) {
                LocalTime timeCurrent = current.getChangedStartTime() != null ? current.getChangedStartTime() : current.getPlannedStartTime();
                LocalTime timeTarget = target.getChangedStartTime() != null ? target.getChangedStartTime() : target.getPlannedStartTime();

                // Swap the effective time into the changedStartTime field to override schedule
                current.setChangedStartTime(timeTarget);
                target.setChangedStartTime(timeCurrent);

                // Save changes and immediately flush to the database within the transaction
                performanceRepository.saveAndFlush(current);
                performanceRepository.saveAndFlush(target);

                messagingTemplate.convertAndSend("/topic/performances", "UPDATE");
                return ResponseEntity.ok().build();
            }
            return ResponseEntity.badRequest().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Deletes a specific performance from the database.
     *
     * @param id the unique identifier of the performance to remove
     * @return a {@link ResponseEntity} indicating success, 404 Not Found, or 500 on error
     */
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deletePerformance(@PathVariable Long id) {
        return performanceRepository.findById(id).map(performance -> {
            try {
                performanceRepository.delete(performance);

                // Notify clients to remove the entity from their active views
                messagingTemplate.convertAndSend("/topic/performances", "UPDATE");

                return ResponseEntity.ok().build();
            } catch (Exception e) {
                return ResponseEntity.status(500).body("Błąd podczas usuwania: " + e.getMessage());
            }
        }).orElse(ResponseEntity.notFound().build());
    }
}