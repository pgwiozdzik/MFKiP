package zti.backend.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import zti.backend.model.Day;
import zti.backend.repository.DayRepository;
import zti.backend.service.DayService;

import java.util.Arrays;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Unit tests for the {@link DayController} class.
 * <p>
 * This test suite utilizes Mockito to mock service and repository layers,
 * and standalone MockMvc to test HTTP request mappings and JSON serialization
 * without the overhead of loading the entire Spring application context.
 * </p>
 */
@ExtendWith(MockitoExtension.class)
class DayControllerTest {

    @Mock
    private DayRepository dayRepository;

    @Mock
    private DayService dayService;

    @InjectMocks
    private DayController dayController;

    private MockMvc mockMvc;

    /**
     * Sets up the standalone MockMvc environment before each test.
     */
    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(dayController)
                .addPlaceholderValue("app.frontend.url", "http://localhost:5173") // <-- DODANA LINIJKA
                .build();
    }

    /**
     * Tests the retrieval of all available festival days.
     */
    @Test
    void shouldReturnAllDays() throws Exception {
        // Given
        Day day1 = new Day();
        day1.setId(1L);
        day1.setName("Thursday");

        Day day2 = new Day();
        day2.setId(2L);
        day2.setName("Friday");

        when(dayRepository.findAll()).thenReturn(Arrays.asList(day1, day2));

        // When & Then
        mockMvc.perform(get("/api/days/all")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(2))
                .andExpect(jsonPath("$[0].name").value("Thursday"))
                .andExpect(jsonPath("$[1].name").value("Friday"));

        verify(dayRepository, times(1)).findAll();
    }

    /**
     * Tests the successful retrieval of the currently active festival day.
     */
    @Test
    void shouldReturnActiveDay() throws Exception {
        // Given
        Day activeDay = new Day();
        activeDay.setId(1L);
        activeDay.setName("Thursday");
        activeDay.setActive(true);

        when(dayRepository.findByIsActiveTrue()).thenReturn(Optional.of(activeDay));

        // When & Then
        mockMvc.perform(get("/api/days/active")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Thursday"))
                .andExpect(jsonPath("$.active").value(true));

        verify(dayRepository, times(1)).findByIsActiveTrue();
    }

    /**
     * Tests that a RuntimeException is thrown when no active day is found in the database.
     * <p>
     * Note: We test the controller method directly here because the default standalone
     * MockMvc exception handler wraps raw exceptions differently than a full Spring boot app.
     * </p>
     */
    @Test
    void shouldThrowExceptionWhenNoActiveDayFound() {
        // Given
        when(dayRepository.findByIsActiveTrue()).thenReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            dayController.getActiveDay();
        });

        assertEquals("Brak aktywnego dnia w bazie!", exception.getMessage());
        verify(dayRepository, times(1)).findByIsActiveTrue();
    }

    /**
     * Tests the activation of a specific festival day.
     */
    @Test
    void shouldActivateDay() throws Exception {
        // Given
        Long targetDayId = 2L;

        // When & Then
        mockMvc.perform(patch("/api/days/{id}/activate", targetDayId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        // Verify that the underlying service logic was triggered correctly
        verify(dayService, times(1)).setActiveDay(targetDayId);
    }
}