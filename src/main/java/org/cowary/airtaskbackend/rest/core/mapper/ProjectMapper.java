package org.cowary.airtaskbackend.rest.core.mapper;

import org.cowary.airtaskbackend.db.entity.ProjectEntity;
import org.cowary.airtaskbackend.rest.core.dto.ProjectCreateRequest;
import org.cowary.airtaskbackend.rest.core.dto.ProjectResponse;
import org.cowary.airtaskbackend.rest.core.dto.ProjectUpdateRequest;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface ProjectMapper {

    ProjectEntity toEntity(ProjectCreateRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(ProjectUpdateRequest request, @MappingTarget ProjectEntity entity);

    ProjectResponse toResponse(ProjectEntity entity);

    // Helper method to convert ProjectEntity with weekly tasks
    ProjectResponse toResponseWithWeekly(ProjectEntity entity);
}