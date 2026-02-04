package org.cowary.airtaskbackend.rest.core.mapper;

import org.cowary.airtaskbackend.db.entity.CompletedWeeklyEntity;
import org.cowary.airtaskbackend.rest.core.dto.CompletedWeeklyDto;
import org.mapstruct.*;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface CompletedWeeklyMapper {

    @Mapping(target = "weeklyId", source = "weeklyEntity.id")
    CompletedWeeklyDto toDto(CompletedWeeklyEntity entity);

    @Mapping(target = "weeklyEntity", ignore = true)
    @Mapping(target = "completedDate", ignore = true)
    CompletedWeeklyEntity toEntity(CompletedWeeklyDto dto);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntityFromDto(CompletedWeeklyDto dto, @MappingTarget CompletedWeeklyEntity entity);
}