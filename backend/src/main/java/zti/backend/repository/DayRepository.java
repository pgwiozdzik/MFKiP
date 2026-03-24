package zti.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import zti.backend.model.Day;
import java.util.Optional;

@Repository
public interface DayRepository extends JpaRepository<Day, Long> {
    Optional<Day> findByIsActiveTrue();
}