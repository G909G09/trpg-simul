-- TRPG 플랫폼 - Supabase 스키마
-- Supabase 프로젝트의 SQL Editor에 이 파일 전체를 붙여넣고 한 번 실행하세요.
--
-- 기존 Google Sheets 구조(backend/Code.gs 참고)를 그대로 테이블로 옮긴 것입니다.
-- 컬럼명을 지금 시트 헤더와 똑같은 한글로 만들어서, docs/index.html의 화면 코드가
-- select() 결과를 그대로 읽을 수 있게(예: row['현재HP']) 했습니다 — 화면 코드를
-- 고칠 필요가 없습니다.
--
-- 로그인 시스템이 없는 소규모 파티용 도구이므로, 지금의 "링크가 있는 모든 사용자"
-- Apps Script 배포와 동일한 신뢰 모델로 anon 롤에 전체 읽기/쓰기 권한을 줍니다.
-- (URL과 anon key를 아는 사람은 누구나 읽고 쓸 수 있음 — 기존과 동등한 수준입니다.)

-- ============ 캐릭터 ============
create table if not exists "캐릭터" (
  "ID" text primary key,
  "플레이어" text,
  "캐릭터명" text,
  "직업/클래스" text,
  "레벨" integer,
  "현재HP" integer,
  "최대HP" integer,
  "스탯(JSON)" text,
  "스킬/특기" text,
  "소지품" text,
  "배경설정" text,
  "이미지URL" text,
  "메모" text,
  "최종수정" text
);

-- ============ NPC / 몬스터 (GM) ============
create table if not exists "NPC_몬스터" (
  "ID" text primary key,
  "이름" text,
  "종류" text,
  "현재HP" integer,
  "최대HP" integer,
  "스탯(JSON)" text,
  "설명" text,
  "메모" text
);

-- ============ 솔로 플레이 캐릭터 ============
create table if not exists "솔로_캐릭터" (
  "ID" text primary key,
  "캐릭터명" text,
  "종족" text,
  "클래스" text,
  "배경" text,
  "능력치(JSON)" text,
  "현재HP" integer,
  "최대HP" integer,
  "스킬/특기" text,
  "소지품" text,
  "외형" text,
  "골드" integer,
  "최종수정" text
);

-- ============ 세션 로그 ============
create table if not exists "세션로그" (
  "_id" bigint generated always as identity primary key,
  "시간" text,
  "작성자" text,
  "유형" text,
  "내용" text
);

-- ============ 주사위 굴리기 기록 ============
create table if not exists "주사위기록" (
  "_id" bigint generated always as identity primary key,
  "시간" text,
  "플레이어" text,
  "캐릭터명" text,
  "주사위식" text,
  "결과상세" text,
  "합계" integer,
  "메모" text
);

-- ============ 게임 상태 (GM 도구 + 솔로 플레이 진행상태 공용 키-값 저장소) ============
create table if not exists "게임상태" (
  "키" text primary key,
  "값" text
);

-- ============ RLS: 로그인 없는 "링크 아는 사람 누구나" 모델 ============
alter table "캐릭터" enable row level security;
alter table "NPC_몬스터" enable row level security;
alter table "솔로_캐릭터" enable row level security;
alter table "세션로그" enable row level security;
alter table "주사위기록" enable row level security;
alter table "게임상태" enable row level security;

create policy "public rw" on "캐릭터" for all to anon, authenticated using (true) with check (true);
create policy "public rw" on "NPC_몬스터" for all to anon, authenticated using (true) with check (true);
create policy "public rw" on "솔로_캐릭터" for all to anon, authenticated using (true) with check (true);
create policy "public rw" on "세션로그" for all to anon, authenticated using (true) with check (true);
create policy "public rw" on "주사위기록" for all to anon, authenticated using (true) with check (true);
create policy "public rw" on "게임상태" for all to anon, authenticated using (true) with check (true);

-- ============ Realtime: 변경사항을 즉시 push 받기 위한 설정 ============
alter table "캐릭터" replica identity full;
alter table "NPC_몬스터" replica identity full;
alter table "솔로_캐릭터" replica identity full;
alter table "세션로그" replica identity full;
alter table "주사위기록" replica identity full;
alter table "게임상태" replica identity full;

alter publication supabase_realtime add table "캐릭터";
alter publication supabase_realtime add table "NPC_몬스터";
alter publication supabase_realtime add table "솔로_캐릭터";
alter publication supabase_realtime add table "세션로그";
alter publication supabase_realtime add table "주사위기록";
alter publication supabase_realtime add table "게임상태";

-- ============ 샘플 캐릭터 (원하면 지워도 됩니다) ============
insert into "캐릭터" ("ID","플레이어","캐릭터명","직업/클래스","레벨","현재HP","최대HP","스탯(JSON)","스킬/특기","소지품","배경설정","이미지URL","메모","최종수정")
values ('c1','예시플레이어','예시캐릭터','전사',1,20,20,'{"STR":14,"DEX":12,"CON":13,"INT":10,"WIS":10,"CHA":8}','강타, 응급처치','장검, 가죽갑옷, 물약x2','변경 자유','','샘플 행입니다. 실제 캐릭터를 추가하며 지워도 됩니다.','')
on conflict ("ID") do nothing;
