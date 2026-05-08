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

@RestController
@RequestMapping("/api/performances")
@CrossOrigin(origins = "http://localhost:5173")
public class PerformanceController {

    @Autowired
    private PerformanceRepository performanceRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Pobieranie wszystkich występów
    @GetMapping("/all")
    public List<Performance> getAllPerformances() {
        return performanceRepository.findAllSorted();
    }

    // Aktualizacja statusu z powiadomieniem WebSocket
    @PatchMapping("/{id}/status")
    public ResponseEntity<Performance> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Optional<Performance> optionalPerformance = performanceRepository.findById(id);

        if (optionalPerformance.isPresent()) {
            Performance performance = optionalPerformance.get();
            String newStatus = payload.get("status");

            // 1. Aktualizujemy status w obiekcie
            performance.setStatus(newStatus);

            // 2. Zapisujemy w bazie
            Performance updated = performanceRepository.save(performance);

            // 3. WYSYŁKA WEBSOCKET: Informujemy wszystkich subskrybentów /topic/performances
            // Wysyłamy prosty tekst "UPDATE" lub cały zaktualizowany obiekt
            messagingTemplate.convertAndSend("/topic/performances", "UPDATE");

            return ResponseEntity.ok(updated);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/day/{dayId}")
    public List<Performance> getPerformancesByDay(@PathVariable Long dayId) {
        return performanceRepository.findByDayIdOrderByPlannedStartTimeAsc(dayId);
    }


    @PostMapping("/add")
    public ResponseEntity<?> addPerformance(@RequestBody Performance performance) {
        try {
            System.out.println("Otrzymano występ: " + performance.getPerformerName());

            Performance saved = performanceRepository.save(performance);

            messagingTemplate.convertAndSend("/topic/performances", "UPDATE");

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace(); // To wypisze DOKŁADNY błąd w konsoli IntelliJ/Eclipse
            return ResponseEntity.status(500).body("Błąd serwera: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePerformance(@PathVariable Long id, @RequestBody Performance performanceDetails) {
        return performanceRepository.findById(id).map(performance -> {
            try {
                // Logowanie dla ułatwienia debugowania
                System.out.println("Edycja występu o ID: " + id);

                // 1. Aktualizacja pól
                performance.setPerformerName(performanceDetails.getPerformerName());
                performance.setPlannedStartTime(performanceDetails.getPlannedStartTime());
                performance.setStatus(performanceDetails.getStatus());
                performance.setBreak(performanceDetails.isBreak());

                // 2. Obsługa Wolontariusza (zapobiega błędom powiązań)
                if (performanceDetails.getVolunteer() != null && performanceDetails.getVolunteer().getId() != null) {
                    performance.setVolunteer(performanceDetails.getVolunteer());
                } else {
                    performance.setVolunteer(null);
                }

                // 3. Zapis
                Performance updated = performanceRepository.save(performance);

                // 4. Powiadomienie WebSocket
                messagingTemplate.convertAndSend("/topic/performances", "UPDATE");

                return ResponseEntity.ok(updated);
            } catch (Exception e) {
                e.printStackTrace();
                return ResponseEntity.status(500).body("Błąd bazy danych: " + e.getMessage());
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/reorder")
    @Transactional
    public ResponseEntity<?> reorderPerformance(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String direction = payload.get("direction");

        return performanceRepository.findById(id).map(current -> {
            // ZMIEŃ TO: Pobierz listę posortowaną tak, jak widzi ją użytkownik (COALESCE)
            // Musisz dodać tę metodę do Repository lub użyć ogólnej, która sortuje poprawnie
            List<Performance> dayPerformances = performanceRepository.findAllByDayIdSorted(current.getDay().getId());

            // Sortowanie listy w Javie, aby zgadzało się z logiką COALESCE (Changed -> Planned)
            dayPerformances.sort((a, b) -> {
                LocalTime tA = a.getChangedStartTime() != null ? a.getChangedStartTime() : a.getPlannedStartTime();
                LocalTime tB = b.getChangedStartTime() != null ? b.getChangedStartTime() : b.getPlannedStartTime();
                return tA.compareTo(tB);
            });

            int currentIndex = dayPerformances.indexOf(current);
            Performance target = null;

            if ("up".equals(direction) && currentIndex > 0) {
                target = dayPerformances.get(currentIndex - 1);
            } else if ("down".equals(direction) && currentIndex < dayPerformances.size() - 1) {
                target = dayPerformances.get(currentIndex + 1);
            }

            if (target != null) {
                LocalTime timeCurrent = current.getChangedStartTime() != null ? current.getChangedStartTime() : current.getPlannedStartTime();
                LocalTime timeTarget = target.getChangedStartTime() != null ? target.getChangedStartTime() : target.getPlannedStartTime();

                // Zamiana
                current.setChangedStartTime(timeTarget);
                target.setChangedStartTime(timeCurrent);

                performanceRepository.saveAndFlush(current);
                performanceRepository.saveAndFlush(target);

                messagingTemplate.convertAndSend("/topic/performances", "UPDATE");
                return ResponseEntity.ok().build();
            }
            return ResponseEntity.badRequest().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}