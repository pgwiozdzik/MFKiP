package zti.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import zti.backend.model.Day;
import zti.backend.model.Performance;
import zti.backend.repository.PerformanceRepository;

import java.time.LocalTime;
import java.util.Arrays;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for the {@link PerformanceController} class.
 * <p>
 * This test suite utilizes Mockito to isolate the controller from the database layer
 * (mocking the repository) and the WebSocket layer (mocking the messaging template).
 * Standalone MockMvc is used to perform fast HTTP requests without bootstrapping
 * the entire Spring context.
 * </p>
 */
@ExtendWith(MockitoExtension.class)
class PerformanceControllerTest {

    @Mock
    private PerformanceRepository performanceRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private PerformanceController performanceController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    /**
     * Sets up the standalone MockMvc environment and configures the JSON mapper
     * to properly handle Java 8 Time API objects (like LocalTime) before each test.
     */
    @BeforeEach
    @SuppressWarnings("removal")
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        mockMvc = MockMvcBuilders.standaloneSetup(performanceController)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .addPlaceholderValue("app.frontend.url", "http://localhost:5173")
                .build();
    }

    /**
     * Tests the retrieval of all performances.
     */
    @Test
    void shouldReturnAllPerformances() throws Exception {
        // Given
        Performance p1 = new Performance();
        p1.setPerformerName("Choir A");

        Performance p2 = new Performance();
        p2.setPerformerName("Soloist B");

        when(performanceRepository.findAllSorted()).thenReturn(Arrays.asList(p1, p2));

        // When & Then
        mockMvc.perform(get("/api/performances/all")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(2))
                .andExpect(jsonPath("$[0].performerName").value("Choir A"));

        verify(performanceRepository, times(1)).findAllSorted();
    }

    /**
     * Tests successful status update of a specific performance and verifies WebSocket broadcast.
     */
    @Test
    void shouldUpdatePerformanceStatus() throws Exception {
        // Given
        Long id = 1L;
        Performance existingPerformance = new Performance();
        existingPerformance.setId(id);
        existingPerformance.setStatus("none");

        when(performanceRepository.findById(id)).thenReturn(Optional.of(existingPerformance));
        when(performanceRepository.save(any(Performance.class))).thenAnswer(i -> i.getArguments()[0]);

        Map<String, String> payload = Map.of("status", "ongoing");

        // When & Then
        mockMvc.perform(patch("/api/performances/{id}/status", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ongoing"));

        verify(performanceRepository, times(1)).save(existingPerformance);
        verify(messagingTemplate, times(1)).convertAndSend("/topic/performances", "UPDATE");
    }

    /**
     * Tests that a 404 Not Found is returned when trying to update the status of a non-existent performance.
     */
    @Test
    void shouldReturnNotFoundWhenUpdatingStatusOfMissingPerformance() throws Exception {
        // Given
        Long id = 99L;
        when(performanceRepository.findById(id)).thenReturn(Optional.empty());

        Map<String, String> payload = Map.of("status", "ongoing");

        // When & Then
        mockMvc.perform(patch("/api/performances/{id}/status", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isNotFound());

        verify(performanceRepository, never()).save(any());
        verify(messagingTemplate, never()).convertAndSend(anyString(), anyString());
    }

    /**
     * Tests adding a new performance and verifies WebSocket broadcast.
     */
    @Test
    void shouldAddPerformance() throws Exception {
        // Given
        Performance newPerformance = new Performance();
        newPerformance.setPerformerName("New Band");
        newPerformance.setPlannedStartTime(LocalTime.of(15, 0));

        when(performanceRepository.save(any(Performance.class))).thenReturn(newPerformance);

        // When & Then
        mockMvc.perform(post("/api/performances/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newPerformance)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.performerName").value("New Band"));

        verify(performanceRepository, times(1)).save(any(Performance.class));
        verify(messagingTemplate, times(1)).convertAndSend("/topic/performances", "UPDATE");
    }

    /**
     * Tests reordering a performance upwards in the schedule.
     */
    @Test
    void shouldReorderPerformanceUp() throws Exception {
        // Given
        Long currentId = 2L;
        Day day = new Day();
        day.setId(1L);

        Performance p1 = new Performance();
        p1.setId(1L);
        p1.setDay(day);
        p1.setPlannedStartTime(LocalTime.of(10, 0));

        Performance p2 = new Performance(); // The one we want to move UP
        p2.setId(currentId);
        p2.setDay(day);
        p2.setPlannedStartTime(LocalTime.of(10, 15));

        when(performanceRepository.findById(currentId)).thenReturn(Optional.of(p2));
        when(performanceRepository.findAllByDayIdSorted(day.getId())).thenReturn(Arrays.asList(p1, p2));

        Map<String, String> payload = Map.of("direction", "up");

        // When & Then
        mockMvc.perform(patch("/api/performances/{id}/reorder", currentId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk());

        verify(performanceRepository, times(2)).saveAndFlush(any(Performance.class));
        verify(messagingTemplate, times(1)).convertAndSend("/topic/performances", "UPDATE");
    }

    /**
     * Tests successful deletion of a performance and verifies WebSocket broadcast.
     */
    @Test
    void shouldDeletePerformance() throws Exception {
        // Given
        Long id = 1L;
        Performance existingPerformance = new Performance();
        existingPerformance.setId(id);

        when(performanceRepository.findById(id)).thenReturn(Optional.of(existingPerformance));

        // When & Then
        mockMvc.perform(delete("/api/performances/{id}", id))
                .andExpect(status().isOk());

        verify(performanceRepository, times(1)).delete(existingPerformance);
        verify(messagingTemplate, times(1)).convertAndSend("/topic/performances", "UPDATE");
    }
}