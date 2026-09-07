package com.zahirimetal.cad.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TubeProjectDto {
    private UUID id;
    private String name;
    private String materialId;
    private String profileType;
    private Double length;
    private Double outerRadius;
    private Double wallThickness;
    private Double rectWidth;
    private Double rectHeight;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID userId;
    private String userEmail;
    private List<CutFeatureDto> cuts;
}
