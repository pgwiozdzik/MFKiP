package zti.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import zti.backend.model.Volunteer;
import zti.backend.repository.VolunteerRepository;

import java.util.List;

/**
 * REST controller responsible for managing festival volunteers.
 * <p>
 * This controller provides standard CRUD (Create, Read, Update, Delete) endpoints
 * to handle the registry of volunteers assisting during the event.
 * </p>
 */
@RestController
@RequestMapping("/api/volunteers")
@CrossOrigin(origins = "${app.frontend.url}", allowCredentials = "true")
public class VolunteerController {

    /**
     * Repository for performing database operations related to the {@link Volunteer} entity.
     */
    @Autowired
    private VolunteerRepository volunteerRepository;

    /**
     * Retrieves a list of all registered volunteers.
     *
     * @return a {@link List} containing all {@link Volunteer} entities currently in the database
     */
    @GetMapping("/all")
    public List<Volunteer> getAllVolunteers() {
        return volunteerRepository.findAll();
    }

    /**
     * Registers a new volunteer in the system.
     *
     * @param volunteer the {@link Volunteer} object containing the new volunteer's details
     * @return the saved {@link Volunteer} entity, including its generated database ID
     */
    @PostMapping("/add")
    public Volunteer addVolunteer(@RequestBody Volunteer volunteer) {
        return volunteerRepository.save(volunteer);
    }

    /**
     * Deletes a specific volunteer from the database.
     *
     * @param id the unique identifier of the volunteer to be removed
     */
    @DeleteMapping("/{id}")
    public void deleteVolunteer(@PathVariable Long id) {
        volunteerRepository.deleteById(id);
    }

    /**
     * Updates the details of an existing volunteer.
     * <p>
     * This method overwrites the volunteer's name and phone number with the provided details.
     * </p>
     *
     * @param id      the unique identifier of the volunteer to update
     * @param details a {@link Volunteer} object containing the updated information
     * @return the updated and saved {@link Volunteer} entity
     * @throws RuntimeException if no volunteer exists with the specified ID
     */
    @PutMapping("/{id}")
    public Volunteer updateVolunteer(@PathVariable Long id, @RequestBody Volunteer details) {
        return volunteerRepository.findById(id).map(vol -> {
            vol.setName(details.getName());
            vol.setPhone(details.getPhone());
            return volunteerRepository.save(vol);
        }).orElseThrow(() -> new RuntimeException("Volunteer not found"));
    }
}