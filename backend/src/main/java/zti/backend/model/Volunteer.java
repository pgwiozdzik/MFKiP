package zti.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "volunteers", schema = "mfkip")
@Data
public class Volunteer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String phone;

    @Column(columnDefinition = "TEXT")
    private String notes;
}