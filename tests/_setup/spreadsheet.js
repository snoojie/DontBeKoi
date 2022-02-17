const GOOGLE_QUOTA_TIMEOUT = 90000;

module.exports = {

    /**
     * Wait a minute before running tests.
     * This is because Google has a quota on read per minute.
     */
    waitGoogleQuota: async function()
    {
        return new Promise(resolve => setTimeout(resolve, GOOGLE_QUOTA_TIMEOUT));
    },

    googleQuotaTimeout: GOOGLE_QUOTA_TIMEOUT
};