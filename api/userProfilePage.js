const ApiHelper = require('./apiHelper');

class UserProfilePage extends ApiHelper {
    async createProfile(userId, profileData, token) {
        const response = await this.request.post(
            `${this.baseUrl}/users/${userId}/profile`,
            {
                data: profileData,
                headers: this.getAuthHeaders(token),
            }
        );
        return this.validateResponse(response, 201);
    }

    async getProfile(userId, token) {
        const response = await this.request.get(
            `${this.baseUrl}/users/${userId}/profile`,
            {
                headers: this.getAuthHeaders(token),
            }
        );
        return this.validateResponse(response, 200);
    }

    async deleteUser(userId, token) {
        const response = await this.request.delete(
            `${this.baseUrl}/users/${userId}`,
            {
                headers: this.getAuthHeaders(token),
            }
        );
        return this.validateResponse(response, 200);
    }
}

module.exports = UserProfilePage;