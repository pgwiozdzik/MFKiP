package zti.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import zti.backend.model.Volunteer;
import zti.backend.repository.VolunteerRepository;

import java.util.Arrays;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for the {@link VolunteerController} class.
 * <p>
 * This test suite utilizes Mockito to isolate the controller from the database layer
 * by mocking the {@link VolunteerRepository}. It uses standalone MockMvc to test
 * HTTP request mappings and JSON serialization for standard CRUD operations.
 * </p>
 */
@ExtendWith(MockitoExtension.class)
class VolunteerControllerTest {

    @Mock
    private VolunteerRepository volunteerRepository;

    @InjectMocks
    private VolunteerController volunteerController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    /**
     * Sets up the standalone MockMvc environment and JSON mapper before each test.
     */
    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(volunteerController)
                .addPlaceholderValue("app.frontend.url", "http://localhost:5173")
                .build();
    }

    /**
     * Tests the retrieval of all registered volunteers.
     */
    @Test
    void shouldReturnAllVolunteers() throws Exception {
        // Given
        Volunteer v1 = new Volunteer();
        v1.setId(1L);
        v1.setName("Jan Kowalski");

        Volunteer v2 = new Volunteer();
        v2.setId(2L);
        v2.setName("Anna Nowak");

        when(volunteerRepository.findAll()).thenReturn(Arrays.asList(v1, v2));

        // When & Then
        mockMvc.perform(get("/api/volunteers/all")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(2))
                .andExpect(jsonPath("$[0].name").value("Jan Kowalski"))
                .andExpect(jsonPath("$[1].name").value("Anna Nowak"));

        verify(volunteerRepository, times(1)).findAll();
    }

    /**
     * Tests the successful registration of a new volunteer.
     */
    @Test
    void shouldAddVolunteer() throws Exception {
        // Given
        Volunteer newVolunteer = new Volunteer();
        newVolunteer.setName("Piotr Wiśniewski");
        newVolunteer.setPhone("123456789");

        Volunteer savedVolunteer = new Volunteer();
        savedVolunteer.setId(1L);
        savedVolunteer.setName("Piotr Wiśniewski");
        savedVolunteer.setPhone("123456789");

        when(volunteerRepository.save(any(Volunteer.class))).thenReturn(savedVolunteer);

        // When & Then
        mockMvc.perform(post("/api/volunteers/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newVolunteer)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Piotr Wiśniewski"));

        verify(volunteerRepository, times(1)).save(any(Volunteer.class));
    }

    /**
     * Tests the successful deletion of a volunteer by their ID.
     */
    @Test
    void shouldDeleteVolunteer() throws Exception {
        // Given
        Long targetId = 1L;
        doNothing().when(volunteerRepository).deleteById(targetId);

        // When & Then
        mockMvc.perform(delete("/api/volunteers/{id}", targetId))
                .andExpect(status().isOk());

        verify(volunteerRepository, times(1)).deleteById(targetId);
    }

    /**
     * Tests the successful update of an existing volunteer's details.
     */
    @Test
    void shouldUpdateVolunteerSuccessfully() throws Exception {
        // Given
        Long id = 1L;
        Volunteer existingVolunteer = new Volunteer();
        existingVolunteer.setId(id);
        existingVolunteer.setName("Old Name");
        existingVolunteer.setPhone("000000000");

        Volunteer updatedDetails = new Volunteer();
        updatedDetails.setName("New Name");
        updatedDetails.setPhone("999999999");

        when(volunteerRepository.findById(id)).thenReturn(Optional.of(existingVolunteer));
        when(volunteerRepository.save(any(Volunteer.class))).thenAnswer(i -> i.getArguments()[0]);

        // When & Then
        mockMvc.perform(put("/api/volunteers/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedDetails)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("New Name"))
                .andExpect(jsonPath("$.phone").value("999999999"));

        verify(volunteerRepository, times(1)).findById(id);
        verify(volunteerRepository, times(1)).save(existingVolunteer);
    }

    /**
     * Tests that a RuntimeException is thrown when attempting to update a volunteer
     * that does not exist in the database.
     * <p>
     * Note: We call the controller method directly to easily assert the specific
     * RuntimeException, avoiding the wrapper exceptions generated by standalone MockMvc.
     * </p>
     */
    @Test
    void shouldThrowExceptionWhenUpdatingNonExistentVolunteer() {
        // Given
        Long nonExistentId = 99L;
        Volunteer updateDetails = new Volunteer();
        updateDetails.setName("Ghost Volunteer");

        when(volunteerRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            volunteerController.updateVolunteer(nonExistentId, updateDetails);
        });

        assertEquals("Volunteer not found", exception.getMessage());
        verify(volunteerRepository, times(1)).findById(nonExistentId);
        verify(volunteerRepository, never()).save(any());
    }
}