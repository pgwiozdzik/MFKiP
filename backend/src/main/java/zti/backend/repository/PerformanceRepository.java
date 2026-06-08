package zti.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import zti.backend.model.Performance;
import java.util.List;

/**
 * Repository interface for managing {@link Performance} entities in the database.
 * <p>
 * This interface extends {@link JpaRepository} to provide standard database operations.
 * Additionally, it defines custom JPQL queries specifically tailored for handling
 * complex scheduling logic, such as sorting by dynamically changing start times
 * versus originally planned times.
 * </p>
 */
@Repository
public interface PerformanceRepository extends JpaRepository<Performance, Long> {

    /**
     * Retrieves all performances across all festival days, sorted chronologically
     * by their changed start time.
     * <p>
     * A secondary sort by ID is applied to guarantee a stable and predictable order
     * if multiple performances share the exact same start time.
     * </p>
     *
     * @return a {@link List} of all {@link Performance} entities globally, sorted by changed time
     */
    @Query("SELECT p FROM Performance p ORDER BY p.changedStartTime ASC, p.id ASC")
    List<Performance> findAllSorted();

    /**
     * Retrieves all performances for a specific festival day, sorted strictly
     * by their originally planned schedule.
     *
     * @param dayId the unique identifier of the festival day to filter by
     * @return a {@link List} of {@link Performance} entities for the requested day,
     * ordered chronologically by the planned start time
     */
    @Query("SELECT p FROM Performance p WHERE p.day.id = :dayId ORDER BY p.plannedStartTime ASC")
    List<Performance> findByDayIdOrderByPlannedStartTimeAsc(@Param("dayId") Long dayId);

    /**
     * Retrieves all performances for a specific festival day, sorted by their effective,
     * real-world schedule order.
     * <p>
     * This query utilizes the SQL {@code COALESCE} function to dynamically determine the
     * sorting column: if a {@code changedStartTime} exists (due to manual reordering or delays),
     * it prioritizes that; otherwise, it safely falls back to the default {@code plannedStartTime}.
     * </p>
     *
     * @param dayId the unique identifier of the festival day to filter by
     * @return a {@link List} of {@link Performance} entities representing the highly accurate,
     * current timeline for the specified day
     */
    @Query("SELECT p FROM Performance p WHERE p.day.id = :dayId " +
            "ORDER BY COALESCE(p.changedStartTime, p.plannedStartTime) ASC, p.id ASC")
    List<Performance> findAllByDayIdSorted(@Param("dayId") Long dayId);
}