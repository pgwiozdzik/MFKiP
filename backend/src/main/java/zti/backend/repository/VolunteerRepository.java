package zti.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import zti.backend.model.Volunteer;

/**
 * Repository interface for managing {@link Volunteer} entities in the database.
 * <p>
 * By extending {@link JpaRepository}, this interface automatically inherits
 * a complete set of standard database operations for the {@code volunteers} table,
 * including methods for saving, deleting, finding by ID, and retrieving all records,
 * without requiring any explicit boilerplate implementation.
 * </p>
 */
public interface VolunteerRepository extends JpaRepository<Volunteer, Long> {
}