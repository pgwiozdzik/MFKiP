package zti.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import zti.backend.model.Day;
import zti.backend.repository.DayRepository;
import zti.backend.service.DayService;

import java.util.List;

/**
 * REST controller responsible for managing festival days.
 * <p>
 * This controller provides endpoints to retrieve all available days,
 * fetch the currently active day, and change which day is currently active.
 * </p>
 */
@RestController
@RequestMapping("/api/days")
@CrossOrigin(origins = "${app.frontend.url}", allowCredentials = "true")
public class DayController {

    /**
     * Repository for performing database operations related to the {@link Day} entity.
     */
    @Autowired
    private DayRepository dayRepository;

    /**
     * Service layer for handling business logic related to festival days.
     */
    @Autowired
    private DayService dayService;

    /**
     * Retrieves a list of all festival days available in the database.
     *
     * @return a {@link List} of all {@link Day} entities
     */
    @GetMapping("/all")
    public List<Day> getAllDays() {
        return dayRepository.findAll();
    }

    /**
     * Retrieves the currently active festival day.
     *
     * @return the {@link Day} entity that is currently marked as active
     * @throws RuntimeException if no active day is found in the database
     */
    @GetMapping("/active")
    public Day getActiveDay() {
        return dayRepository.findByIsActiveTrue()
                .orElseThrow(() -> new RuntimeException("Brak aktywnego dnia w bazie!"));
    }

    /**
     * Sets a specific festival day as the currently active one.
     * <p>
     * This operation typically involves deactivating the previously active day
     * and activating the requested one.
     * </p>
     *
     * @param id the unique identifier of the {@link Day} to be activated
     */
    @PatchMapping("/{id}/activate")
    public void activateDay(@PathVariable Long id) {
        dayService.setActiveDay(id);
    }
}