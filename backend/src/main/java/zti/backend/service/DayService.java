package zti.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import zti.backend.model.Day;
import zti.backend.repository.DayRepository;

@Service // DODANO: Spring musi wiedzieć, że to komponent serwisowy
public class DayService {

    @Autowired
    private DayRepository dayRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void setActiveDay(Long dayId) {
        // 1. Wszystkie dni na false (używamy metody z repozytorium)
        dayRepository.deactivateAllDays();

        // 2. Wybrany dzień na true
        Day day = dayRepository.findById(dayId)
                .orElseThrow(() -> new RuntimeException("Nie znaleziono dnia o ID: " + dayId));

        day.setActive(true);
        dayRepository.save(day);

        messagingTemplate.convertAndSend("/topic/performances", "UPDATE");
    }
}