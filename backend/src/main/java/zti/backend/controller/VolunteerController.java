package zti.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import zti.backend.model.Volunteer;
import zti.backend.repository.VolunteerRepository;

import java.util.List;

@RestController
@RequestMapping("/api/volunteers")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class VolunteerController {

    @Autowired
    private VolunteerRepository volunteerRepository;

    @GetMapping("/all")
    public List<Volunteer> getAllVolunteers() {
        return volunteerRepository.findAll();
    }

    @PostMapping("/add")
    public Volunteer addVolunteer(@RequestBody Volunteer volunteer) {
        return volunteerRepository.save(volunteer);
    }

    @DeleteMapping("/{id}")
    public void deleteVolunteer(@PathVariable Long id) {
        volunteerRepository.deleteById(id);
    }
}