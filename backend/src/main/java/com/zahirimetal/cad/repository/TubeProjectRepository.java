package com.zahirimetal.cad.repository;

import com.zahirimetal.cad.entity.TubeProject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TubeProjectRepository extends JpaRepository<TubeProject, UUID> {
    List<TubeProject> findAllByOrderByCreatedAtDesc();
    List<TubeProject> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
}
