package com.zahirimetal.cad.service.impl;

import com.zahirimetal.cad.dto.CutFeatureDto;
import com.zahirimetal.cad.dto.TubeProjectDto;
import com.zahirimetal.cad.entity.CutFeature;
import com.zahirimetal.cad.entity.TubeProject;
import com.zahirimetal.cad.entity.User;
import com.zahirimetal.cad.repository.TubeProjectRepository;
import com.zahirimetal.cad.repository.UserRepository;
import com.zahirimetal.cad.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

    private final TubeProjectRepository tubeProjectRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public TubeProjectDto saveProject(TubeProjectDto projectDto) {
        TubeProject project = TubeProject.builder()
                .id(projectDto.getId())
                .projectName(projectDto.getName() != null ? projectDto.getName() : "Zahiri_Tube_Project")
                .material(projectDto.getMaterialId())
                .profileType(projectDto.getProfileType())
                .totalLength(projectDto.getLength())
                .outerDiameter(projectDto.getOuterRadius() * 2)
                .wallThickness(projectDto.getWallThickness())
                .rectWidth(projectDto.getRectWidth())
                .rectHeight(projectDto.getRectHeight())
                .build();

        // Associate user if logged in or passed in DTO
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User userPrincipal) {
            project.setUser(userPrincipal);
        } else if (projectDto.getUserId() != null) {
            userRepository.findById(projectDto.getUserId()).ifPresent(project::setUser);
        }

        if (projectDto.getCuts() != null) {
            projectDto.getCuts().forEach(cDto -> {
                CutFeature cut = CutFeature.builder()
                        .name(cDto.getName())
                        .type(cDto.getType())
                        .zOffset(cDto.getPositionZ())
                        .polarAngle(cDto.getPolarAngle())
                        .cutDiameter(cDto.getRadius() != null ? cDto.getRadius() * 2 : null)
                        .cutLength(cDto.getSlotLength())
                        .cutWidth(cDto.getSlotWidth())
                        .mitreAngle(cDto.getMitreAngle())
                        .enabled(cDto.getEnabled() != null ? cDto.getEnabled() : true)
                        .build();
                project.addCut(cut);
            });
        }

        TubeProject saved = tubeProjectRepository.save(project);
        return mapToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public TubeProjectDto getProjectById(UUID id) {
        TubeProject project = tubeProjectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("CAD Project not found with ID: " + id));
        return mapToDto(project);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TubeProjectDto> getAllProjects() {
        return tubeProjectRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TubeProjectDto> getProjectsByUser(UUID userId) {
        return tubeProjectRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteProject(UUID id) {
        tubeProjectRepository.deleteById(id);
    }

    private TubeProjectDto mapToDto(TubeProject entity) {
        List<CutFeatureDto> cutDtos = entity.getCuts().stream()
                .map(c -> CutFeatureDto.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .type(c.getType())
                        .positionZ(c.getZOffset())
                        .polarAngle(c.getPolarAngle())
                        .radius(c.getCutDiameter() != null ? c.getCutDiameter() / 2 : null)
                        .slotLength(c.getCutLength())
                        .slotWidth(c.getCutWidth())
                        .mitreAngle(c.getMitreAngle())
                        .enabled(c.getEnabled())
                        .build())
                .collect(Collectors.toList());

        return TubeProjectDto.builder()
                .id(entity.getId())
                .name(entity.getProjectName())
                .materialId(entity.getMaterial())
                .profileType(entity.getProfileType())
                .length(entity.getTotalLength())
                .outerRadius(entity.getOuterDiameter() / 2)
                .wallThickness(entity.getWallThickness())
                .rectWidth(entity.getRectWidth())
                .rectHeight(entity.getRectHeight())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .userId(entity.getUser() != null ? entity.getUser().getId() : null)
                .userEmail(entity.getUser() != null ? entity.getUser().getEmail() : null)
                .cuts(cutDtos)
                .build();
    }
}
