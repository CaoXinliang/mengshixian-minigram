function approvedMemberUser(result) {
  const user = result && result.ok && result.data && result.data.user;
  if (!user || user.status === 'disabled') return null;
  return user;
}

async function authorizeMemberPage(page, auth, options) {
  const revision = Number(page._memberAuthRevision || 0) + 1;
  page._memberAuthRevision = revision;
  page.setData({ status: 'loading', errorText: '' });
  let result = null;
  try { result = await auth.getMe(); } catch (error) { result = null; }
  if (page._memberAuthRevision !== revision) return null;
  const user = approvedMemberUser(result);
  if (user) return { revision, user };
  if (typeof options.reset === 'function') options.reset();
  page.setData({ ...options.clear, status: 'forbidden', errorText: options.forbiddenText });
  return null;
}

function isCurrentMemberLoad(page, access) {
  return Boolean(access && page._memberAuthRevision === access.revision);
}

module.exports = { authorizeMemberPage, isCurrentMemberLoad };
