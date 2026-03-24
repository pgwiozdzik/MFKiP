package zti.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import zti.backend.model.Performance;
import java.util.List;

@Repository
public interface PerformanceRepository extends JpaRepository<Performance, Long> {
    // Ta metoda automatycznie wygeneruje SQL: SELECT * FROM performances WHERE day_id = ...
    List<Performance> findByDayId(Long dayId);

    // Ta metoda pobierze wszystko
    List<Performance> findAll();
}