# データベース設計ドキュメント

---

## 設計原則

1. **正規化を優先する。** NULLableなカラムを持つテーブルを作らない。オプショナルな属性は別テーブルに分離する。
2. **UPDATEを避ける。** INSERT と DELETE のみでデータの整合性が取れる設計を意識する。
3. **DB非依存で実装する。** EloquentのmigrationとORMのみを使う。Raw SQLおよびDB固有の関数は使わない。
4. **JSONカラムへのアクセスは `$casts` 経由に統一する。** `$table->json()` はMySQLでは `JSON` 型、SQLiteでは `TEXT` 型になるが、`$casts = ['field' => 'array']` でLaravelが差分を吸収する。

---

## テーブル一覧

```
users                       ユーザー
passkeys                    パスキー認証情報
user_recovery_credentials   メール・パスワードによるリカバリ情報（任意）
rooms                       ルーム
room_users                  ルームとユーザーの中間テーブル（ロール管理）
things                      モノ
specs                       スペック（モノのスキーマ定義）
parameters                  パラメータ（スペックを構成するフィールド）
parameter_constraints       パラメータの制約（文字数制限など）
contents                    コンテンツ（モノに投稿される実データ）
```

---

## テーブル定義

### users

| カラム | 型 | 備考 |
|--------|-----|------|
| id | BIGINT UNSIGNED PK | |
| name | VARCHAR(255) | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

メールアドレスとパスワードは `user_recovery_credentials` に分離する（登録任意のため）。

---

### passkeys

| カラム | 型 | 備考 |
|--------|-----|------|
| id | BIGINT UNSIGNED PK | |
| user_id | BIGINT UNSIGNED FK | → users.id |
| credential_id | VARCHAR(512) UNIQUE | WebAuthn Credential ID |
| public_key | TEXT | WebAuthn 公開鍵 |
| sign_count | BIGINT UNSIGNED | リプレイ攻撃防止用カウンター |
| created_at | TIMESTAMP | |

---

### user_recovery_credentials

| カラム | 型 | 備考 |
|--------|-----|------|
| id | BIGINT UNSIGNED PK | |
| user_id | BIGINT UNSIGNED FK UNIQUE | → users.id（1ユーザー1レコード） |
| email | VARCHAR(255) UNIQUE | |
| password_hash | VARCHAR(255) | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

`users` テーブルにメールアドレスを持たせず、このテーブルに分離することでNULLableカラムをなくす。

---

### rooms

| カラム | 型 | 備考 |
|--------|-----|------|
| id | BIGINT UNSIGNED PK | |
| name | VARCHAR(255) | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### room_users

| カラム | 型 | 備考 |
|--------|-----|------|
| id | BIGINT UNSIGNED PK | |
| room_id | BIGINT UNSIGNED FK | → rooms.id |
| user_id | BIGINT UNSIGNED FK | → users.id |
| role | ENUM('admin') | MVPはadminのみ。UNIQUE(room_id, user_id) |
| created_at | TIMESTAMP | |

将来の複数ユーザー・ロール対応に備えて中間テーブルを用意する。MVPではroleは `admin` 固定。

---

### things

| カラム | 型 | 備考 |
|--------|-----|------|
| id | BIGINT UNSIGNED PK | |
| room_id | BIGINT UNSIGNED FK | → rooms.id |
| thing_id | VARCHAR(64) | 半角英数スラッグ。UNIQUE(room_id, thing_id) |
| name | VARCHAR(255) | 管理画面表示名 |
| type | ENUM('single', 'multiple') | 変更不可 |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

`type` は作成後に変更できない。コンテンツの件数制約が崩れるため。

---

### specs

| カラム | 型 | 備考 |
|--------|-----|------|
| id | BIGINT UNSIGNED PK | |
| thing_id | BIGINT UNSIGNED FK UNIQUE | → things.id（1モノ1スペック） |
| created_at | TIMESTAMP | |

スペック自体の属性は持たない。パラメータの集合として機能する。スキーマ変更時はパラメータをDELETE + INSERTすることで対応する（specレコード自体は変えない）。

---

### parameters

| カラム | 型 | 備考 |
|--------|-----|------|
| id | BIGINT UNSIGNED PK | |
| spec_id | BIGINT UNSIGNED FK | → specs.id |
| name | VARCHAR(64) | 半角英数。APIレスポンスのキー名。UNIQUE(spec_id, name) |
| label | VARCHAR(255) | 管理画面表示名 |
| type | ENUM('string') | MVPは文字列のみ |
| is_required | BOOLEAN | デフォルト TRUE |
| sort_order | INT UNSIGNED | 表示順 |
| created_at | TIMESTAMP | |

`is_required` はデフォルトTRUE（必須）。パラメータを任意にしたい場合はFALSEを明示する。

---

### parameter_constraints

| カラム | 型 | 備考 |
|--------|-----|------|
| id | BIGINT UNSIGNED PK | |
| parameter_id | BIGINT UNSIGNED FK UNIQUE | → parameters.id |
| max_length | INT UNSIGNED | |
| created_at | TIMESTAMP | |

文字数制限はオプショナルなため、`parameters` テーブルに NULLable カラムとして持たせず、このテーブルに分離する。文字数制限が不要なパラメータにはレコードが存在しない。

---

### contents

| カラム | 型 | 備考 |
|--------|-----|------|
| id | BIGINT UNSIGNED PK | |
| thing_id | BIGINT UNSIGNED FK | → things.id |
| data | JSON | パラメータのnameをキーとした実データ |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

`type = 'single'` のモノに対して2件以上のコンテンツが存在してはならない。アプリケーション層で制御する。

---

## テーブルのER関係

```
users ──< passkeys
users ──< user_recovery_credentials  (0 or 1)
users ──< room_users >── rooms
rooms ──< things
things ──── specs ──< parameters ──── parameter_constraints (0 or 1)
things ──< contents
```

---

## migrationの作成順序

外部キー制約の依存関係に従い、以下の順番で作成する。

```
1. users
2. passkeys
3. user_recovery_credentials
4. rooms
5. room_users
6. things
7. specs
8. parameters
9. parameter_constraints
10. contents
```

---

## スキーマ変更時の挙動

パラメータを追加・削除・変更したとき、既存の `contents.data` は自動では変わらない。

| 操作 | 既存データへの影響 | 対応方針 |
|------|-------------------|---------|
| パラメータ追加 | 既存コンテンツにそのキーが存在しない | APIレスポンス時に `null` を返す |
| パラメータ削除 | 既存コンテンツにキーが残り続ける | レスポンス組み立て時にキーを除外する |
| `name` の変更 | 実質的なデータロスト | 管理画面でエラーを出して操作を阻止する |

APIレスポンスを組み立てるときは、現在のスペックに存在するパラメータの `name` のみを `contents.data` から抽出して返すこと。

---

## `contents.data` のフォーマット

パラメータの `name` をキーとして使う。

```json
{
  "title": "MacBook Pro レビュー",
  "body": "本文テキスト..."
}
```

---

## DBサポート方針

| DB | サポートレベル | 主な用途 |
|----|--------------|---------|
| MySQL 5.7以上 | ファーストクラス | レンタルサーバー |
| SQLite 3.38以上 | セカンドクラス | PaaS（fly.io等）・ローカル開発 |
| Turso（LibSQL） | コミュニティサポート | エッジ環境 |

CIはMySQL / SQLiteの両方でテストを回すこと。