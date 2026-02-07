package org.cowary.airtaskbackend.config;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ValueDeserializer;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

public class CustomLocalDateTimeDeserializer extends ValueDeserializer<LocalDateTime> {

    private static final DateTimeFormatter LOCAL_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSSSSSSS");
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME; // Поддерживает +03:00

    @Override
    public LocalDateTime deserialize(tools.jackson.core.JsonParser p, tools.jackson.databind.DeserializationContext ctxt) throws JacksonException {
        String value = p.getValueAsString();

        if (value == null || value.isEmpty()) {
            return null;
        }

        try {
            // Пробуем распарсить как OffsetDateTime (например, с +03:00)
            OffsetDateTime offsetDateTime = OffsetDateTime.parse(value, ISO_FORMATTER);
            return offsetDateTime.toLocalDateTime();
        } catch (DateTimeParseException exOffset) {
            try {
                // Если не получилось — пробуем как чистый LocalDateTime
                return LocalDateTime.parse(value, LOCAL_FORMATTER);
            } catch (DateTimeParseException exLocal) {
                // Оба способа не сработали
                throw ctxt.weirdStringException(value, LocalDateTime.class,
                        "Cannot parse as LocalDateTime or OffsetDateTime. Expected format: 'yyyy-MM-dd'T'HH:mm:ss.SSSSSSSSS' or ISO with offset.");
            }
        }
    }
}

