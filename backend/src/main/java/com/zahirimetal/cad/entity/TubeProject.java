package com.zahirimetal.cad.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "tube_projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TubeProject {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "project_name", nullable = false)
    private String projectName;

    @Column(name = "material_id", nullable = false)
    private String material;

    @Column(name = "profile_type", nullable = false)
    private String profileType;

    @Column(name = "total_length", nullable = false)
    private Double totalLength;

    @Column(name = "outer_diameter", nullable = false)
    private Double outerDiameter;

    @Column(name = "wall_thickness", nullable = false)
    private Double wallThickness;

    @Column(name = "rect_width")
    private Double rectWidth;

    @Column(name = "rect_height")
    private Double rectHeight;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "tubeProject", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<CutFeature> cuts = new ArrayList<>();

    public void addCut(CutFeature cut) {
        cuts.add(cut);
        cut.setTubeProject(this);
    }

    public void removeCut(CutFeature cut) {
        cuts.remove(cut);
        cut.setTubeProject(null);
    }
}
