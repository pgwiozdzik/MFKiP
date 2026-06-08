package zti.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import zti.backend.model.Day;
import java.util.Optional;

/**
 * Repository interface for managing {@link Day} entities in the database.
 * <p>
 * By extending {@link JpaRepository}, this interface provides standard CRUD
 * (Create, Read, Update, Delete) operations and pagination capabilities
 * automatically without requiring an explicit implementation class.
 * </p>
 */
public interface DayRepository extends JpaRepository<Day, Long> {

    /**
     * Retrieves the festival day that is currently marked as active.
     * <p>
     * Under normal business rules, only one day should be active at any given time.
     * </p>
     *
     * @return an {@link Optional} containing the active {@link Day} if found,
     * or an empty {@code Optional} if no day is currently active
     */
    Optional<Day> findByIsActiveTrue();

    /**
     * Deactivates all festival days in the database.
     * <p>
     * This is a bulk update operation that sets the {@code isActive} flag to {@code false}
     * for every record in the {@code days} table. It is typically called immediately
     * before activating a new day to ensure that only one day remains active.
     * </p>
     */
    @Modifying
    @Query("UPDATE Day d SET d.isActive = false")
    void deactivateAllDays();
}