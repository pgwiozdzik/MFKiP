package zti.backend.dto;

import lombok.Data;

/**
 * Data Transfer Object (DTO) for handling status update requests.
 * <p>
 * This class encapsulates the payload sent by the client when updating
 * the status of a specific entity (such as a festival performance).
 * </p>
 * <p>
 * Note: The use of Lombok's {@code @Data} annotation automatically generates
 * boilerplate code at compile time, including getters, setters, {@code equals()},
 * {@code hashCode()}, and a {@code toString()} method.
 * </p>
 */
@Data
public class StatusUpdateRequest {

    /**
     * The new status value to be applied to the entity.
     */
    private String status;
}