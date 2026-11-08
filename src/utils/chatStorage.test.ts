import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSession,
  addMessageToSession,
  renameSession,
  updateMessageFeedback,
  removeLastAssistantMessage,
  searchSessions,
  generateChatTitle,
} from './chatStorage';

test('createSession initializes with clean state and default title', () => {
  const session = createSession();
  assert.ok(session.id.startsWith('chat_'));
  assert.equal(session.title, 'Percakapan Baru');
  assert.equal(session.messages.length, 0);
  assert.ok(session.createdAt > 0);
});

test('generateChatTitle cleanly formats user messages', () => {
  assert.equal(generateChatTitle(''), 'Percakapan Baru');
  assert.equal(generateChatTitle('   '), 'Percakapan Baru');
  assert.equal(generateChatTitle('Halo dunia'), 'Halo dunia');
  assert.equal(
    generateChatTitle('Bagaimana cara membuat fungsi debounce di JavaScript modern untuk input pencarian?').endsWith('...'),
    true
  );
});

test('addMessageToSession auto-generates title on first user message', () => {
  const session = createSession();
  const { updatedSession, newMessage } = addMessageToSession(
    session,
    'user',
    'Jelaskan cara kerja quantum computing'
  );

  assert.equal(updatedSession.messages.length, 1);
  assert.equal(newMessage.role, 'user');
  assert.equal(newMessage.content, 'Jelaskan cara kerja quantum computing');
  assert.equal(updatedSession.title, 'Jelaskan cara kerja quantum computing');
});

test('renameSession updates title and timestamp', () => {
  const session = createSession('Lama');
  const renamed = renameSession(session, 'Judul Baru');
  assert.equal(renamed.title, 'Judul Baru');
  assert.ok(renamed.updatedAt >= session.updatedAt);
});

test('updateMessageFeedback sets thumb rating correctly', () => {
  let session = createSession();
  const { updatedSession: s1, newMessage: m1 } = addMessageToSession(session, 'user', 'Halo');
  const { updatedSession: s2, newMessage: m2 } = addMessageToSession(s1, 'assistant', 'Halo juga!');
  
  const updatedWithFeedback = updateMessageFeedback(s2, m2.id, 'up');
  const assistantMsg = updatedWithFeedback.messages.find(m => m.id === m2.id);
  assert.equal(assistantMsg?.feedback, 'up');
});

test('removeLastAssistantMessage isolates last assistant response for regenerate', () => {
  let session = createSession();
  const res1 = addMessageToSession(session, 'user', 'Pertanyaan');
  const res2 = addMessageToSession(res1.updatedSession, 'assistant', 'Jawaban lama');
  
  const { updatedSession, lastUserMessage } = removeLastAssistantMessage(res2.updatedSession);
  assert.equal(updatedSession.messages.length, 1);
  assert.equal(lastUserMessage?.content, 'Pertanyaan');
});

test('searchSessions filters by title and message content', () => {
  const s1 = createSession('Belajar React');
  const r1 = addMessageToSession(s1, 'user', 'Bagaimana cara pakai useEffect?');

  const s2 = createSession('Resep Masakan');
  const r2 = addMessageToSession(s2, 'user', 'Cara membuat nasi goreng spesial');

  const all = [r1.updatedSession, r2.updatedSession];

  const result1 = searchSessions(all, 'React');
  assert.equal(result1.length, 1);
  assert.equal(result1[0].id, s1.id);

  const result2 = searchSessions(all, 'goreng');
  assert.equal(result2.length, 1);
  assert.equal(result2[0].id, s2.id);

  const resultEmpty = searchSessions(all, 'nonexistent query 123');
  assert.equal(resultEmpty.length, 0);
});
