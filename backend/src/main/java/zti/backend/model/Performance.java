package zti.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalTime;

@Entity
@Table(name = "performances", schema = "mfkip")
@Data
public class Performance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "day_id", nullable = false)
    @JsonIgnoreProperties("performances")
    private Day day;

    @Column(name = "planned_start_time", nullable = false)
    private LocalTime plannedStartTime;

    @Column(name = "changed_start_time")
    private LocalTime changedStartTime;

    @Column(name = "actual_start_time")
    private LocalTime actualStartTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "performer_name", nullable = false)
    private String performerName;

    private String status = "none";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "volunteer_id")
    private Volunteer volunteer;

    @Column(name = "is_break")
    private boolean isBreak = false;
}