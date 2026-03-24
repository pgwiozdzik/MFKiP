package zti.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import zti.backend.model.Day;
import zti.backend.repository.DayRepository;

@RestController
@RequestMapping("/api/days")
public class DayController {

    @Autowired
    private DayRepository dayRepository;

    @GetMapping("/active")
    public Day getActiveDay() {
        // Zwraca pierwszy znaleziony aktywny dzień lub błąd jeśli brak
        return dayRepository.findByIsActiveTrue()
                .orElseThrow(() -> new RuntimeException("Brak aktywnego dnia w bazie!"));
    }
}