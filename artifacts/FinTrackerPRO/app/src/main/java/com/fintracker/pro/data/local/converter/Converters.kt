package com.fintracker.pro.data.local.converter

import androidx.room.TypeConverter
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneOffset

class Converters {
    @TypeConverter
    fun fromEpochDay(value: Long?): LocalDate? = value?.let { LocalDate.ofEpochDay(it) }

    @TypeConverter
    fun toEpochDay(date: LocalDate?): Long? = date?.toEpochDay()

    @TypeConverter
    fun fromTimestamp(value: Long?): LocalDateTime? =
        value?.let { LocalDateTime.ofEpochSecond(it / 1000, 0, ZoneOffset.UTC) }

    @TypeConverter
    fun toTimestamp(dateTime: LocalDateTime?): Long? =
        dateTime?.toEpochSecond(ZoneOffset.UTC)?.times(1000)
}
