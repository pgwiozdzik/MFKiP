package zti.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import zti.backend.model.Day;
import zti.backend.repository.DayRepository;
import zti.backend.service.DayService;

import java.util.List;

@RestController
@RequestMapping("/api/days")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true") // Dla Reacta
public class DayController {

    @Autowired
    private DayRepository dayRepository;

    @Autowired
    private DayService dayService; // POPRAWIONE: Typ musi być DayService

    @GetMapping("/all")
    public List<Day> getAllDays() {
        return dayRepository.findAll();
    }

    @GetMapping("/active")
    public Day getActiveDay() {
        return dayRepository.findByIsActiveTrue()
                .orElseThrow(() -> new RuntimeException("Brak aktywnego dnia w bazie!"));
    }

    @PatchMapping("/{id}/activate")
    public void activateDay(@PathVariable Long id) {
        dayService.setActiveDay(id);
    }
}