package org.cowary.airtaskbackend.rest.core.mapper;

import org.cowary.airtaskbackend.db.entity.WeeklyEntity;
import org.cowary.airtaskbackend.rest.core.dto.WeeklyDto;
import org.mapstruct.*;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface WeeklyMapper {

    @Mapping(target = "projectId", source = "project.id")
    WeeklyDto toDto(WeeklyEntity entity);

    @Mapping(target = "project", ignore = true)
    WeeklyEntity toEntity(WeeklyDto dto);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntityFromDto(WeeklyDto dto, @MappingTarget WeeklyEntity entity);
}