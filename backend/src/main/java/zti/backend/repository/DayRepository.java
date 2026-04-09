package zti.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import zti.backend.model.Day;
import java.util.Optional;

public interface DayRepository extends JpaRepository<Day, Long> {

    Optional<Day> findByIsActiveTrue();

    @Modifying
    @Query("UPDATE Day d SET d.isActive = false")
    void deactivateAllDays();
}