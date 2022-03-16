# TGBucket
Open source project that provide simple HTTP API to upload and download files to/from Telegram.\
Use directly [MTProto](https://core.telegram.org/mtproto) protocol to upload files up to 2GB with a simple bot token.\
Based on [NestJS](https://github.com/nestjs/nest) framework.

## Features
- Upload any files
- Download uploaded files
- Resend message with file

## Requirements
- node
- postgres
- pnpm

## Docker
Deploy ready container avaiable on [DockerHub](https://hub.docker.com/r/morb0/tgbucket)

## Getting Started
- Create [Telegram application](https://core.telegram.org/api/obtaining_api_id)
- Create Telegram bot with [BotFather](https://t.me/botfather)
- [Install](https://www.postgresql.org/) or run in [container](https://hub.docker.com/_/postgres) PostgreSQL
- Create Telegram chat for bot uploads and get chat id by [guide](https://gist.github.com/mraaroncruz/e76d19f7d61d59419002db54030ebe35)

## Environment variables
  | env                    | required | description                                           |
  | ---------------------- | -------- | -------------------------------------------           |
  | DATABASE_URL           | yes      | Database connection URL                               |
  | TELEGRAM_API_ID        | yes      | Application ID from your Telegram App                 |
  | TELEGRAM_API_HASH      | yes      | Application hash from your Telegram App               |
  | TELEGRAM_BOT_TOKEN     | yes      | Telegram bot token                                    |
  | TELEGRAM_CHAT_ID       | yes      | Chat ID to upload files                               |

## Installation
- Copy `.env.example`, rename to `.env` and setup all variables
- Install dependencies

  ```bash
  pnpm install
  ```
- Build project

  ```bash
  pnpm build:prod
  ```
- Start application

  ```bash
  pnpm start:prod
  ```
- Open `localhost:3000` and see `ok` message *(default port: 3000)*

## API
### `POST /` - File upload
**Request:**\
Accept binary file\
Require `Content-Type` and `Content-Length` headers.\
Optionally can be passed `X-Filename` header to save filename to uploaded file. Saved file name will be used when downloading.\
Max file size - **2000MiB**

**Response:**\
Return JSON serialized [`FileEntity`](https://github.com/Morb0/tgbucket/blob/master/src/files/file.entity.ts)

### `GET /:id` - Download file
**Request:**\
Require id of uploaded file in url\

**Response:**\
Return binary file stream with `Content-Type` and timestamp in filename.
OR use custom filename if wass passed `X-Filename` header on upload.

### `POST /:id/resend` - Send file in message
**Request:**\
Require id of uploaded file in url and JSON body:
```json
{ "username": "myTgUsername" }
```

**Response:**\
Nothing

## How to Contribute

- Fork and clone this repository
- Commit your changes
- Create a pull request to `master` branch

Or, just send us an [issue](https://github.com/Morb0/tgbucket/issues) for reporting bugs or ask questions and share your ideas, etc in [discussions](https://github.com/Morb0/tgbucket/discussions).
