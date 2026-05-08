package zti.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import zti.backend.model.Performance;
import java.util.List;

@Repository
public interface PerformanceRepository extends JpaRepository<Performance, Long> {
    // Ta metoda automatycznie wygeneruje SQL: SELECT * FROM performances WHERE day_id = ...
    List<Performance> findByDayId(Long dayId);

    @Query("SELECT p FROM Performance p ORDER BY p.changedStartTime ASC, p.id ASC")
    List<Performance> findAllSorted();

    @Query("SELECT p FROM Performance p WHERE p.day.id = :dayId ORDER BY p.plannedStartTime ASC")
    List<Performance> findByDayIdOrderByPlannedStartTimeAsc(@Param("dayId") Long dayId);

    @Query("SELECT p FROM Performance p WHERE p.day.id = :dayId " +
            "ORDER BY COALESCE(p.changedStartTime, p.plannedStartTime) ASC, p.id ASC")
    List<Performance> findAllByDayIdSorted(@Param("dayId") Long dayId);
}