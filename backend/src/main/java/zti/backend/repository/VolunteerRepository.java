package zti.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import zti.backend.model.Volunteer;

public interface VolunteerRepository extends JpaRepository<Volunteer, Long> {
}