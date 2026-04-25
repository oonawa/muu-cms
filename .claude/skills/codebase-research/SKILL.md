---
name: codebase-research
description: コードベースを調査し、指定されたトピックに関連するファイル・クラス・依存関係を特定して報告する。アーキテクチャの理解や実装方針の検討に必要な情報を収集する。
user-invocable: false
model: haiku
allowed-tools: Read Grep Glob Bash(ls *) Bash(git log *) Bash(git show *) Bash(git diff *)
---

# コードベース調査スキル

与えられたトピックについて、このリポジトリのコードベースを調査し、関連する情報を収集・報告する。

## プロジェクト概要

- Laravel 11 / React 19 (TypeScript) / Inertia.js / Vite
- バックエンド: `src/app/Http/Controllers/`, `src/app/Models/`
- フロントエンド: `src/resources/js/Pages/`
- テスト: `src/tests/Feature/`（PHPUnit）、`src/tests/e2e/`（Playwright）
- マイグレーション: `src/database/migrations/`

## 調査手順

1. トピックに関連するファイルを Glob と Grep で特定する
2. 関連ファイルを Read で読み、構造・型・依存関係を把握する
3. 必要に応じて git log で変更履歴を確認する

## 報告フォーマット

### 関連ファイル
- ファイルパスと各ファイルの役割を箇条書き

### 現状の実装
- 該当機能の現在の実装を簡潔に説明

### モデル・マイグレーション
- 関連する Eloquent モデルとマイグレーションの構造

### 依存関係
- 他のコントローラ・モデル・ミドルウェアとの依存関係
