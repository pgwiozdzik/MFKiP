package zti.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import zti.backend.model.Performance;
import java.util.List;

@Repository
public interface PerformanceRepository extends JpaRepository<Performance, Long> {
    // Ta metoda automatycznie wygeneruje SQL: SELECT * FROM performances WHERE day_id = ...
    List<Performance> findByDayId(Long dayId);

    @Query("SELECT p FROM Performance p ORDER BY p.changedStartTime ASC, p.id ASC")
    List<Performance> findAllSorted();

    // Pobiera występy po ID dnia i sortuje je chronologicznie
    List<Performance> findByDayIdOrderByPlannedStartTimeAsc(Long dayId);
}