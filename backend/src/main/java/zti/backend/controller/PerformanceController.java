package zti.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import zti.backend.model.Performance;
import zti.backend.repository.PerformanceRepository;

import java.util.List;

@RestController
@RequestMapping("/api/performances")
// Pamiętaj, że WebConfig.java który dodałeś, zajmie się uprawnieniami (CORS),
// więc React będzie mógł tu zajrzeć.
public class PerformanceController {

    @Autowired
    private PerformanceRepository performanceRepository;

    @GetMapping("/all")
    public List<Performance> getAllPerformances() {
        // To pobierze wszystko z tabeli mfkip.performances i zamieni na JSON
        return performanceRepository.findAll();
    }
}