package org.cowary.airtaskbackend.rest.core.mapper;

import org.cowary.airtaskbackend.db.entity.ProjectEntity;
import org.cowary.airtaskbackend.rest.core.dto.ProjectDto;
import org.mapstruct.*;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface ProjectMapper {

    @Mapping(target = "weeklyIdList", ignore = true)
    ProjectDto toDto(ProjectEntity entity);

    @Mapping(target = "weeklyEntityList", ignore = true)
    ProjectEntity toEntity(ProjectDto dto);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntityFromDto(ProjectDto dto, @MappingTarget ProjectEntity entity);

    @AfterMapping
    default void mapWeeklyEntityListToIdList(@MappingTarget ProjectDto dto, ProjectEntity entity) {
        if (entity.getWeeklyEntityList() != null) {
            dto.setWeeklyIdList(entity.getWeeklyEntityList().stream().map(w -> w.getId()).toList());
        }
    }

    @AfterMapping
    default void mapWeeklyIdsToEntity(@MappingTarget ProjectEntity entity, ProjectDto dto) {
        // This will be handled separately if needed
    }
}