package com.fintracker.pro.data.local.dao

import androidx.room.*
import com.fintracker.pro.data.local.entity.*
import kotlinx.coroutines.flow.Flow

@Dao
interface UserDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(user: UserEntity): Long

    @Query("SELECT * FROM users WHERE id = :id")
    suspend fun getById(id: Long): UserEntity?

    @Query("SELECT * FROM users WHERE email = :email LIMIT 1")
    suspend fun getByEmail(email: String): UserEntity?

    @Query("SELECT * FROM users WHERE username = :username LIMIT 1")
    suspend fun getByUsername(username: String): UserEntity?

    @Query("SELECT * FROM users WHERE google_id = :googleId LIMIT 1")
    suspend fun getByGoogleId(googleId: String): UserEntity?

    @Update
    suspend fun update(user: UserEntity)
}

@Dao
interface UserSettingsDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(settings: UserSettingsEntity)

    @Query("SELECT * FROM user_settings WHERE userId = :userId")
    fun observe(userId: Long): Flow<UserSettingsEntity?>

    @Query("SELECT * FROM user_settings WHERE userId = :userId")
    suspend fun get(userId: Long): UserSettingsEntity?

    @Update
    suspend fun update(settings: UserSettingsEntity)

    @Query("UPDATE user_settings SET currentStreak = :streak, lastBudgetDay = :lastDay, lastStreakDate = :lastStreak WHERE userId = :userId")
    suspend fun updateStreak(userId: Long, streak: Int, lastDay: Long?, lastStreak: Long?)
}

@Dao
interface CategoryDao {
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insert(category: CategoryEntity): Long

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertAll(categories: List<CategoryEntity>)

    @Query("SELECT * FROM categories WHERE userId = :userId ORDER BY name")
    fun observeAll(userId: Long): Flow<List<CategoryEntity>>

    @Query("SELECT * FROM categories WHERE userId = :userId ORDER BY name")
    suspend fun getAll(userId: Long): List<CategoryEntity>

    @Update
    suspend fun update(category: CategoryEntity)

    @Query("DELETE FROM categories WHERE id = :id")
    suspend fun delete(id: Long)
}

@Dao
interface EnvelopeDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(envelope: EnvelopeEntity): Long

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertAll(envelopes: List<EnvelopeEntity>)

    @Query("SELECT * FROM envelopes WHERE userId = :userId ORDER BY name")
    fun observeAll(userId: Long): Flow<List<EnvelopeEntity>>

    @Query("SELECT * FROM envelopes WHERE userId = :userId ORDER BY name")
    suspend fun getAll(userId: Long): List<EnvelopeEntity>

    @Update
    suspend fun update(envelope: EnvelopeEntity)

    @Query("DELETE FROM envelopes WHERE id = :id")
    suspend fun delete(id: Long)
}

@Dao
interface TransactionDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(tx: TransactionEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(txs: List<TransactionEntity>)

    @Update
    suspend fun update(tx: TransactionEntity)

    @Query("DELETE FROM transactions WHERE id = :id")
    suspend fun delete(id: Long)

    @Query("DELETE FROM transactions WHERE userId = :userId AND transactionDate = :date")
    suspend fun deleteByDay(userId: Long, date: Long)

    @Query("DELETE FROM transactions WHERE userId = :userId AND transactionDate >= :from AND transactionDate <= :to")
    suspend fun deleteByRange(userId: Long, from: Long, to: Long)

    @Query("SELECT * FROM transactions WHERE userId = :userId ORDER BY transactionDate DESC, createdAt DESC")
    fun observeAll(userId: Long): Flow<List<TransactionEntity>>

    @Query("SELECT * FROM transactions WHERE userId = :userId ORDER BY transactionDate DESC, createdAt DESC")
    suspend fun getAll(userId: Long): List<TransactionEntity>

    @Query("SELECT * FROM transactions WHERE userId = :userId AND transactionDate = :date")
    suspend fun getByDate(userId: Long, date: Long): List<TransactionEntity>

    @Query("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE userId = :userId AND type = 'EXPENSE' AND envelopeId = :envelopeId")
    suspend fun getSpentForEnvelope(userId: Long, envelopeId: Long): Double

    @Query("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE userId = :userId AND type = 'EXPENSE' AND transactionDate = :date")
    suspend fun getSpentOnDate(userId: Long, date: Long): Double
}

@Dao
interface FixedEventDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(event: FixedEventEntity): Long

    @Update
    suspend fun update(event: FixedEventEntity)

    @Query("DELETE FROM fixed_events WHERE id = :id")
    suspend fun delete(id: Long)

    @Query("SELECT * FROM fixed_events WHERE userId = :userId ORDER BY eventDate")
    fun observeAll(userId: Long): Flow<List<FixedEventEntity>>

    @Query("SELECT * FROM fixed_events WHERE userId = :userId ORDER BY eventDate")
    suspend fun getAll(userId: Long): List<FixedEventEntity>
}

@Dao
interface AchievementDao {
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insert(achievement: AchievementEntity): Long

    @Query("SELECT * FROM achievements WHERE userId = :userId ORDER BY unlockedAt DESC")
    fun observeAll(userId: Long): Flow<List<AchievementEntity>>

    @Query("SELECT * FROM achievements WHERE userId = :userId AND code = :code LIMIT 1")
    suspend fun getByCode(userId: Long, code: String): AchievementEntity?
}

@Dao
interface CategorizationRuleDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(rule: CategorizationRuleEntity): Long

    @Query("SELECT * FROM categorization_rules WHERE userId = :userId ORDER BY LENGTH(pattern) DESC")
    suspend fun getAllOrderedByLength(userId: Long): List<CategorizationRuleEntity>
}
