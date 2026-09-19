const { isApprovedBusiness } = require('../modules/identity-state');

function approvedBusinessUser(result) {
  const user = result && result.ok && result.data && result.data.user;
  if (!isApprovedBusiness(user)) return null;
  return user;
}

async function authorizeBusinessPage(page, auth, options) {
  const revision = Number(page._businessAuthRevision || 0) + 1;
  page._businessAuthRevision = revision;
  page.setData({ status: 'loading', errorText: '' });
  let result = null;
  try { result = await auth.getMe(); } catch (error) { result = null; }
  if (page._businessAuthRevision !== revision) return null;
  const user = approvedBusinessUser(result);
  if (user) return { revision, user };
  if (typeof options.reset === 'function') options.reset();
  page.setData({ ...options.clear, status: 'forbidden', errorText: options.forbiddenText });
  return null;
}

function isCurrentBusinessLoad(page, access) {
  return Boolean(access && page._businessAuthRevision === access.revision);
}

module.exports = { authorizeBusinessPage, isCurrentBusinessLoad };
