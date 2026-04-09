package zti.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import zti.backend.model.Performance;
import zti.backend.repository.PerformanceRepository;

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
        // Zakładając, że w encji Performance masz pole: Day day
        return performanceRepository.findByDayIdOrderByPlannedStartTimeAsc(dayId);
    }
}