package org.cowary.airtaskbackend.rest.core.mapper;

import org.cowary.airtaskbackend.db.entity.CompletedWeeklyEntity;
import org.cowary.airtaskbackend.db.entity.WeeklyEntity;
import org.cowary.airtaskbackend.rest.core.dto.CompletedWeeklyCreateRequest;
import org.cowary.airtaskbackend.rest.core.dto.CompletedWeeklyResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CompletedWeeklyMapper {

    @Mapping(target = "completedDate", source = "request.completedDate")
    @Mapping(target = "weeklyEntity", source = "weeklyEntity")
    CompletedWeeklyEntity toEntity(CompletedWeeklyCreateRequest request, WeeklyEntity weeklyEntity);

    @Mapping(target = "weeklyEntityId", source = "weeklyEntity.id")
    @Mapping(target = "weeklyEntityName", source = "weeklyEntity.name")
    CompletedWeeklyResponse toResponse(CompletedWeeklyEntity entity);
}