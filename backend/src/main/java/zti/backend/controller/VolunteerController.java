package zti.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import zti.backend.model.Volunteer;
import zti.backend.repository.VolunteerRepository;

import java.util.List;

@RestController
@RequestMapping("/api/volunteers") // To musi pasować do Twojego API_URL + /volunteers
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class VolunteerController {

    @Autowired
    private VolunteerRepository volunteerRepository;

    @GetMapping("/all")
    public List<Volunteer> getAllVolunteers() {
        // Pobieramy wszystkich wolontariuszy z bazy mfkip.volunteers
        return volunteerRepository.findAll();
    }
}