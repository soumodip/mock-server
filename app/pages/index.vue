<template>
  <div class="min-h-screen bg-[#1a1d2e] p-6">
    <div class="max-w-7xl mx-auto">
      <HeaderContainer />
      <!-- Projects Section -->
      <div class="mb-8 mt-12">
        <h2 class="text-xl font-medium text-gray-300 mb-3">Projects</h2>
        <div class="bg-[#242736] rounded-xl shadow-lg p-4 space-y-4">
          <div class="flex justify-between items-center">
            <div class="flex gap-2 items-center">
              <CommonDropdown v-model="projectStore.selectedProjectId" :options="projectOptions"
                placeholder="Select a project" @change="handleProjectChange" />
              <button v-if="canWrite()" @click="openModal('createProject', null)"
                class="px-3 py-1.5 bg-[#2d3142] text-gray-300 rounded-full hover:bg-[#353849] transition-colors flex items-center gap-1.5 text-sm">
                <Icon name="mdi:plus" class="w-4 h-4" />
                Create Project
              </button>
            </div>
            <div class="flex gap-2">
              <button @click="openModal('groups', null)" :disabled="!projectStore.selectedProjectId"
                class="px-3 py-1.5 text-gray-300 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm">
                <Icon name="mdi:folder-outline" class="w-4 h-4" />
                Groups
              </button>
              <button @click="downloadPostmanCollection" :disabled="!projectStore.selectedProjectId"
                class="px-3 py-1.5 text-gray-300 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm">
                <Icon name="material-symbols:download" class="w-4 h-4" />
                Postman
              </button>
              <button @click="openModal('downloadProject', null)" :disabled="!projectStore.selectedProjectId"
                class="px-3 py-1.5 text-gray-300 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm">
                <Icon name="material-symbols:download" class="w-4 h-4" />
                Project
              </button>
              <Icon name="ant-design:small-dash-outlined" class="w-4 h-4 text-gray-600 self-center" />
              <button v-if="canDelete()" @click="openModal('deleteProject', null)" :disabled="!projectStore.selectedProjectId"
                class="px-3 py-1.5 text-red-500 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm">
                <Icon name="mdi:delete" class="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>

          <!-- Enable Auth Section -->
          <div v-if="selectedProject" class="border-t border-gray-600 pt-4">
            <div class="flex items-center gap-3 mb-3">
              <button v-if="canWrite()" type="button" @click="toggleProjectAuth"
                class="relative inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-200"
                :class="selectedProject.isAuth
                  ? 'bg-indigo-600 border-indigo-600'
                  : 'bg-[#2d3142] border-gray-600 hover:border-gray-500'">
                <Icon name="mdi:check" class="w-4 h-4 text-white transition-all duration-200"
                  :class="selectedProject.isAuth ? 'opacity-100 scale-100' : 'opacity-0 scale-0'" />
              </button>
              <label v-if="canWrite()" class="text-sm font-medium text-gray-300 cursor-pointer" @click="toggleProjectAuth">
                Enable Auth
              </label>
            </div>

            <div v-if="selectedProject && selectedProject.isAuth" class="space-y-3">
              <!-- Auth Type Selector -->
              <div v-if="canWrite()">
                <label class="text-xs text-gray-400 mb-1 block">Auth Type</label>
                <CommonDropdown v-model="authTypeInput" :options="authTypeOptions" placeholder="Select auth type"
                  @change="handleAuthTypeChange" />
              </div>
              <div v-else class="text-sm text-gray-300 m-0 pl-2">
                <p><span class="font-medium">Auth Type:</span> {{ authTypeInput }}</p>
              </div>

              <!-- Dynamic Auth Fields -->
              <div v-if="authTypeInput" class="space-y-2">
                <!-- API Key -->
                <template v-if="authTypeInput === 'api-key'">
                  <div class="relative">
                    <input v-model="authConfigInput.apiKeyHeader" type="text" placeholder="X-API-Key"
                      class="w-full px-3 py-2 pr-10 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500" />
                    <button @click="copyToClipboard(authConfigInput.apiKeyHeader)"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy to clipboard">
                      <Icon name="mdi:content-copy" class="w-4 h-4" />
                    </button>
                  </div>
                  <div class="relative">
                    <input v-model="authConfigInput.apiKey" type="text" placeholder="API Key Value"
                      class="w-full px-3 py-2 pr-10 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500" />
                    <button @click="copyToClipboard(authConfigInput.apiKey)"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy to clipboard">
                      <Icon name="mdi:content-copy" class="w-4 h-4" />
                    </button>
                  </div>
                </template>

                <!-- Bearer Token -->
                <template v-if="authTypeInput === 'bearer-token'">
                  <div class="relative">
                    <input v-model="authConfigInput.bearerToken" type="text" placeholder="Bearer Token"
                      class="w-full px-3 py-2 pr-10 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500" />
                    <button @click="copyAuthValue('bearerToken')"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy to clipboard">
                      <Icon name="mdi:content-copy" class="w-4 h-4" />
                    </button>
                  </div>
                </template>

                <!-- Basic Auth -->
                <template v-if="authTypeInput === 'basic-auth'">
                  <div class="relative">
                    <input v-model="authConfigInput.basicUsername" type="text" placeholder="Username"
                      class="w-full px-3 py-2 pr-10 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500" />
                    <button @click="copyToClipboard(authConfigInput.basicUsername)"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy to clipboard">
                      <Icon name="mdi:content-copy" class="w-4 h-4" />
                    </button>
                  </div>
                  <div class="relative">
                    <input v-model="authConfigInput.basicPassword"
                      :type="passwordVisibility.basicPassword ? 'text' : 'password'"
                      class="w-full px-3 py-2 pr-16 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500"
                      placeholder="Password" />
                    <button @click="passwordVisibility.basicPassword = !passwordVisibility.basicPassword"
                      class="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      :title="passwordVisibility.basicPassword ? 'Hide password' : 'Show password'">
                      <Icon :name="passwordVisibility.basicPassword ? 'mdi:eye-off' : 'mdi:eye'" class="w-4 h-4" />
                    </button>
                    <button @click="copyToClipboard(authConfigInput.basicPassword)"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy to clipboard">
                      <Icon name="mdi:content-copy" class="w-4 h-4" />
                    </button>
                  </div>
                  <!-- Combined Basic Auth Token -->
                  <div v-if="basicAuthCombinedToken"
                    class="relative mt-2 p-3 bg-[#1f2230] rounded-lg border border-gray-600">
                    <div class="text-xs text-gray-400 mb-1">Token</div>
                    <div class="flex items-center gap-2">
                      <code class="text-xs text-gray-300 break-all flex-1">{{ basicAuthCombinedToken }}</code>
                      <button @click="copyToClipboard(basicAuthCombinedToken)"
                        class="text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors flex-shrink-0"
                        title="Copy token">
                        <Icon name="mdi:content-copy" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </template>

                <!-- Digest Auth -->
                <template v-if="authTypeInput === 'digest-auth'">
                  <div class="relative">
                    <input v-model="authConfigInput.digestUsername" type="text" placeholder="Username"
                      class="w-full px-3 py-2 pr-10 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500" />
                    <button @click="copyToClipboard(authConfigInput.digestUsername)"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy to clipboard">
                      <Icon name="mdi:content-copy" class="w-4 h-4" />
                    </button>
                  </div>
                  <div class="relative">
                    <input v-model="authConfigInput.digestPassword"
                      :type="passwordVisibility.digestPassword ? 'text' : 'password'" placeholder="Password"
                      class="w-full px-3 py-2 pr-16 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500" />
                    <button @click="passwordVisibility.digestPassword = !passwordVisibility.digestPassword"
                      class="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      :title="passwordVisibility.digestPassword ? 'Hide password' : 'Show password'">
                      <Icon :name="passwordVisibility.digestPassword ? 'mdi:eye-off' : 'mdi:eye'" class="w-4 h-4" />
                    </button>
                    <button @click="copyToClipboard(authConfigInput.digestPassword)"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy to clipboard">
                      <Icon name="mdi:content-copy" class="w-4 h-4" />
                    </button>
                  </div>
                  <div class="relative">
                    <input v-model="authConfigInput.digestRealm" type="text" placeholder="Realm (optional)"
                      class="w-full px-3 py-2 pr-10 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500" />
                    <button @click="copyToClipboard(authConfigInput.digestRealm)"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy to clipboard">
                      <Icon name="mdi:content-copy" class="w-4 h-4" />
                    </button>
                  </div>
                  <!-- Combined Digest Auth Token -->
                  <div v-if="digestAuthCombinedToken"
                    class="relative mt-2 p-3 bg-[#1f2230] rounded-lg border border-gray-600">
                    <div class="text-xs text-gray-400 mb-1">Token</div>
                    <div class="flex items-center gap-2">
                      <code class="text-xs text-gray-300 break-all flex-1">{{ digestAuthCombinedToken }}</code>
                      <button @click="copyToClipboard(digestAuthCombinedToken)"
                        class="text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors flex-shrink-0"
                        title="Copy token">
                        <Icon name="mdi:content-copy" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </template>

                <!-- OAuth 1.0 -->
                <template v-if="authTypeInput === 'oauth1'">
                  <div class="relative">
                    <input v-model="authConfigInput.oauth1ConsumerKey" type="text" placeholder="Consumer Key"
                      class="w-full px-3 py-2 pr-10 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500" />
                    <button @click="copyToClipboard(authConfigInput.oauth1ConsumerKey)"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy to clipboard">
                      <Icon name="mdi:content-copy" class="w-4 h-4" />
                    </button>
                  </div>
                  <div class="relative">
                    <input v-model="authConfigInput.oauth1ConsumerSecret"
                      :type="passwordVisibility.oauth1ConsumerSecret ? 'text' : 'password'"
                      placeholder="Consumer Secret"
                      class="w-full px-3 py-2 pr-16 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500" />
                    <button @click="passwordVisibility.oauth1ConsumerSecret = !passwordVisibility.oauth1ConsumerSecret"
                      class="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      :title="passwordVisibility.oauth1ConsumerSecret ? 'Hide password' : 'Show password'">
                      <Icon :name="passwordVisibility.oauth1ConsumerSecret ? 'mdi:eye-off' : 'mdi:eye'"
                        class="w-4 h-4" />
                    </button>
                    <button @click="copyToClipboard(authConfigInput.oauth1ConsumerSecret)"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy to clipboard">
                      <Icon name="mdi:content-copy" class="w-4 h-4" />
                    </button>
                  </div>
                  <div class="relative">
                    <input v-model="authConfigInput.oauth1Token" type="text" placeholder="Token"
                      class="w-full px-3 py-2 pr-10 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500" />
                    <button @click="copyToClipboard(authConfigInput.oauth1Token)"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy to clipboard">
                      <Icon name="mdi:content-copy" class="w-4 h-4" />
                    </button>
                  </div>
                  <div class="relative">
                    <input v-model="authConfigInput.oauth1TokenSecret"
                      :type="passwordVisibility.oauth1TokenSecret ? 'text' : 'password'" placeholder="Token Secret"
                      class="w-full px-3 py-2 pr-16 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500" />
                    <button @click="passwordVisibility.oauth1TokenSecret = !passwordVisibility.oauth1TokenSecret"
                      class="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      :title="passwordVisibility.oauth1TokenSecret ? 'Hide password' : 'Show password'">
                      <Icon :name="passwordVisibility.oauth1TokenSecret ? 'mdi:eye-off' : 'mdi:eye'" class="w-4 h-4" />
                    </button>
                    <button @click="copyToClipboard(authConfigInput.oauth1TokenSecret)"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy to clipboard">
                      <Icon name="mdi:content-copy" class="w-4 h-4" />
                    </button>
                  </div>
                  <!-- Combined OAuth 1.0 Token -->
                  <div v-if="oauth1CombinedToken"
                    class="relative mt-2 p-3 bg-[#1f2230] rounded-lg border border-gray-600">
                    <div class="text-xs text-gray-400 mb-1">Token</div>
                    <div class="flex items-center gap-2">
                      <code class="text-xs text-gray-300 break-all flex-1">{{ oauth1CombinedToken }}</code>
                      <button @click="copyToClipboard(oauth1CombinedToken)"
                        class="text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors flex-shrink-0"
                        title="Copy token">
                        <Icon name="mdi:content-copy" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </template>

                <!-- OAuth 2.0 -->
                <template v-if="authTypeInput === 'oauth2'">
                  <div class="relative">
                    <input v-model="authConfigInput.oauth2AccessToken" type="text" placeholder="Access Token"
                      class="w-full px-3 py-2 pr-10 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500" />
                    <button @click="copyToClipboard(authConfigInput.oauth2AccessToken)"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy to clipboard">
                      <Icon name="mdi:content-copy" class="w-4 h-4" />
                    </button>
                  </div>
                  <div class="relative">
                    <input v-model="authConfigInput.oauth2ClientId" type="text" placeholder="Client ID (optional)"
                      class="w-full px-3 py-2 pr-10 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500" />
                    <button @click="copyToClipboard(authConfigInput.oauth2ClientId)"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy to clipboard">
                      <Icon name="mdi:content-copy" class="w-4 h-4" />
                    </button>
                  </div>
                  <div class="relative">
                    <input v-model="authConfigInput.oauth2ClientSecret"
                      :type="passwordVisibility.oauth2ClientSecret ? 'text' : 'password'"
                      placeholder="Client Secret (optional)"
                      class="w-full px-3 py-2 pr-16 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500" />
                    <button @click="passwordVisibility.oauth2ClientSecret = !passwordVisibility.oauth2ClientSecret"
                      class="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      :title="passwordVisibility.oauth2ClientSecret ? 'Hide password' : 'Show password'">
                      <Icon :name="passwordVisibility.oauth2ClientSecret ? 'mdi:eye-off' : 'mdi:eye'" class="w-4 h-4" />
                    </button>
                    <button @click="copyToClipboard(authConfigInput.oauth2ClientSecret)"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy to clipboard">
                      <Icon name="mdi:content-copy" class="w-4 h-4" />
                    </button>
                  </div>
                </template>

                <!-- Hawk Authentication -->
                <template v-if="authTypeInput === 'hawk'">
                  <div class="relative">
                    <input v-model="authConfigInput.hawkId" type="text" placeholder="Hawk ID"
                      class="w-full px-3 py-2 pr-10 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500" />
                    <button @click="copyToClipboard(authConfigInput.hawkId)"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy to clipboard">
                      <Icon name="mdi:content-copy" class="w-4 h-4" />
                    </button>
                  </div>
                  <div class="relative">
                    <input v-model="authConfigInput.hawkKey" :type="passwordVisibility.hawkKey ? 'text' : 'password'"
                      placeholder="Hawk Key"
                      class="w-full px-3 py-2 pr-16 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500" />
                    <button @click="passwordVisibility.hawkKey = !passwordVisibility.hawkKey"
                      class="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      :title="passwordVisibility.hawkKey ? 'Hide password' : 'Show password'">
                      <Icon :name="passwordVisibility.hawkKey ? 'mdi:eye-off' : 'mdi:eye'" class="w-4 h-4" />
                    </button>
                    <button @click="copyToClipboard(authConfigInput.hawkKey)"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy to clipboard">
                      <Icon name="mdi:content-copy" class="w-4 h-4" />
                    </button>
                  </div>
                  <div class="relative">
                    <input v-model="authConfigInput.hawkAlgorithm" type="text" placeholder="Algorithm (e.g., sha256)"
                      class="w-full px-3 py-2 pr-10 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500" />
                    <button @click="copyToClipboard(authConfigInput.hawkAlgorithm)"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy to clipboard">
                      <Icon name="mdi:content-copy" class="w-4 h-4" />
                    </button>
                  </div>
                  <!-- Combined Hawk Token -->
                  <div v-if="hawkCombinedToken"
                    class="relative mt-2 p-3 bg-[#1f2230] rounded-lg border border-gray-600">
                    <div class="text-xs text-gray-400 mb-1">Token</div>
                    <div class="flex items-center gap-2">
                      <code class="text-xs text-gray-300 break-all flex-1">{{ hawkCombinedToken }}</code>
                      <button @click="copyToClipboard(hawkCombinedToken)"
                        class="text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors flex-shrink-0"
                        title="Copy token">
                        <Icon name="mdi:content-copy" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </template>

                <!-- AWS Signature -->
                <template v-if="authTypeInput === 'aws-signature'">
                  <div class="relative">
                    <input v-model="authConfigInput.awsAccessKeyId" type="text" placeholder="Access Key ID"
                      class="w-full px-3 py-2 pr-10 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500" />
                    <button @click="copyToClipboard(authConfigInput.awsAccessKeyId)"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy to clipboard">
                      <Icon name="mdi:content-copy" class="w-4 h-4" />
                    </button>
                  </div>
                  <div class="relative">
                    <input v-model="authConfigInput.awsSecretAccessKey"
                      :type="passwordVisibility.awsSecretAccessKey ? 'text' : 'password'"
                      placeholder="Secret Access Key"
                      class="w-full px-3 py-2 pr-16 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500" />
                    <button @click="passwordVisibility.awsSecretAccessKey = !passwordVisibility.awsSecretAccessKey"
                      class="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      :title="passwordVisibility.awsSecretAccessKey ? 'Hide password' : 'Show password'">
                      <Icon :name="passwordVisibility.awsSecretAccessKey ? 'mdi:eye-off' : 'mdi:eye'" class="w-4 h-4" />
                    </button>
                    <button @click="copyToClipboard(authConfigInput.awsSecretAccessKey)"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy to clipboard">
                      <Icon name="mdi:content-copy" class="w-4 h-4" />
                    </button>
                  </div>
                  <div class="relative">
                    <input v-model="authConfigInput.awsRegion" type="text" placeholder="Region (e.g., us-east-1)"
                      class="w-full px-3 py-2 pr-10 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500" />
                    <button @click="copyToClipboard(authConfigInput.awsRegion)"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy to clipboard">
                      <Icon name="mdi:content-copy" class="w-4 h-4" />
                    </button>
                  </div>
                  <div class="relative">
                    <input v-model="authConfigInput.awsService" type="text" placeholder="Service (e.g., s3)"
                      class="w-full px-3 py-2 pr-10 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500" />
                    <button @click="copyToClipboard(authConfigInput.awsService)"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy to clipboard">
                      <Icon name="mdi:content-copy" class="w-4 h-4" />
                    </button>
                  </div>
                  <!-- Combined AWS Token -->
                  <div v-if="awsCombinedToken" class="relative mt-2 p-3 bg-[#1f2230] rounded-lg border border-gray-600">
                    <div class="text-xs text-gray-400 mb-1">Token</div>
                    <div class="flex items-center gap-2">
                      <code class="text-xs text-gray-300 break-all flex-1">{{ awsCombinedToken }}</code>
                      <button @click="copyToClipboard(awsCombinedToken)"
                        class="text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors flex-shrink-0"
                        title="Copy token">
                        <Icon name="mdi:content-copy" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </template>

                <!-- Akamai EdgeGrid -->
                <template v-if="authTypeInput === 'akamai-edgegrid'">
                  <div class="relative">
                    <input v-model="authConfigInput.akamaiClientToken" type="text" placeholder="Client Token"
                      class="w-full px-3 py-2 pr-10 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500" />
                    <button @click="copyToClipboard(authConfigInput.akamaiClientToken)"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy to clipboard">
                      <Icon name="mdi:content-copy" class="w-4 h-4" />
                    </button>
                  </div>
                  <div class="relative">
                    <input v-model="authConfigInput.akamaiClientSecret"
                      :type="passwordVisibility.akamaiClientSecret ? 'text' : 'password'" placeholder="Client Secret"
                      class="w-full px-3 py-2 pr-16 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500" />
                    <button @click="passwordVisibility.akamaiClientSecret = !passwordVisibility.akamaiClientSecret"
                      class="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      :title="passwordVisibility.akamaiClientSecret ? 'Hide password' : 'Show password'">
                      <Icon :name="passwordVisibility.akamaiClientSecret ? 'mdi:eye-off' : 'mdi:eye'" class="w-4 h-4" />
                    </button>
                    <button @click="copyToClipboard(authConfigInput.akamaiClientSecret)"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy to clipboard">
                      <Icon name="mdi:content-copy" class="w-4 h-4" />
                    </button>
                  </div>
                  <div class="relative">
                    <input v-model="authConfigInput.akamaiAccessToken" type="text" placeholder="Access Token"
                      class="w-full px-3 py-2 pr-10 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500" />
                    <button @click="copyToClipboard(authConfigInput.akamaiAccessToken)"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy to clipboard">
                      <Icon name="mdi:content-copy" class="w-4 h-4" />
                    </button>
                  </div>
                  <!-- Combined Akamai Token -->
                  <div v-if="akamaiCombinedToken"
                    class="relative mt-2 p-3 bg-[#1f2230] rounded-lg border border-gray-600">
                    <div class="text-xs text-gray-400 mb-1">Token</div>
                    <div class="flex items-center gap-2">
                      <code class="text-xs text-gray-300 break-all flex-1">{{ akamaiCombinedToken }}</code>
                      <button @click="copyToClipboard(akamaiCombinedToken)"
                        class="text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors flex-shrink-0"
                        title="Copy token">
                        <Icon name="mdi:content-copy" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </template>

                <!-- JWT Bearer -->
                <template v-if="authTypeInput === 'jwt-bearer'">
                  <div class="relative">
                    <input v-model="authConfigInput.jwtToken" type="text" placeholder="JWT Token"
                      class="w-full px-3 py-2 pr-10 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500" />
                    <button @click="copyToClipboard(authConfigInput.jwtToken)"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy to clipboard">
                      <Icon name="mdi:content-copy" class="w-4 h-4" />
                    </button>
                  </div>
                  <div class="relative">
                    <input v-model="authConfigInput.jwtSecret"
                      :type="passwordVisibility.jwtSecret ? 'text' : 'password'"
                      placeholder="Secret (for verification, optional)"
                      class="w-full px-3 py-2 pr-16 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500" />
                    <button @click="passwordVisibility.jwtSecret = !passwordVisibility.jwtSecret"
                      class="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      :title="passwordVisibility.jwtSecret ? 'Hide password' : 'Show password'">
                      <Icon :name="passwordVisibility.jwtSecret ? 'mdi:eye-off' : 'mdi:eye'" class="w-4 h-4" />
                    </button>
                    <button @click="copyToClipboard(authConfigInput.jwtSecret)"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy to clipboard">
                      <Icon name="mdi:content-copy" class="w-4 h-4" />
                    </button>
                  </div>
                </template>

                <!-- Update Button -->
                <div v-if="canWrite()" class="flex gap-2 pt-1">
                  <button @click="updateAuthConfig" :disabled="projectStore.loading"
                    class="px-3 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                    Update Auth
                  </button>
                  <button @click="regenerateAuthCredentials" :disabled="projectStore.loading"
                    class="px-3 py-2 bg-[#2d3142] text-gray-300 rounded-full hover:bg-[#353849] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                    Regenerate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="selectedProject" class="flex flex-col grow-0 my-8">
        <h2 class="text-xl font-medium text-gray-300 mb-1">Base URI</h2>
        <div class="flex flex-row items-center grow-0 gap-4">
          <code class="text-gray-400 text-sm">{{ mockServerBaseUri }}/api/projects/{{ selectedProject.id }}</code>
          <button
            @click="copyToClipboard(`${mockServerBaseUri}/api/projects/${selectedProject.id}`)"
            class="text-gray-400 hover:text-gray-200 transition-colors"
            title="Copy to clipboard">
            <Icon name="mdi:content-copy" class="w-4 h-4 opacity-55" />
          </button>
        </div>
      </div>

      <div class="flex justify-between items-center mb-4">
        <h1 class="text-xl font-medium text-gray-300">APIs</h1>
        <div class="flex gap-2">
          <button
            v-if="hasProjects && canWrite()"
            @click="openModal('swaggerUpload', null)"
            :class="[
              'px-3 py-1.5 text-gray-300 rounded-full transition-colors flex items-center gap-1.5 text-sm',
              showUploadButtonShine ? 'upload-button-shine' : ''
            ]">
            <Icon name="tabler:upload" class="w-4 h-4" />
            Upload <span class="font-medium">OpenAPI Spec</span>
          </button>
          <button
            v-else
            disabled
            class="px-3 py-1.5 bg-[#2d3142] text-gray-500 rounded-full cursor-not-allowed flex items-center gap-1.5 opacity-50 text-sm"
            title="Please create a project first">
            <Icon name="mdi:file-code-outline" class="w-4 h-4" />
            Upload OpenAPI Spec
          </button>
          <NuxtLink v-if="hasProjects && canWrite()" to="/api-mocks/new"
            class="px-3 py-1.5 bg-[#2d3142] text-gray-300 rounded-full hover:bg-[#353849] transition-colors flex items-center gap-1.5 text-sm">
            <Icon name="mdi:plus" class="w-4 h-4" />
            Create API
          </NuxtLink>
          <button v-else disabled
            class="px-3 py-1.5 bg-[#2d3142] text-gray-500 rounded-full cursor-not-allowed flex items-center gap-1.5 opacity-50 text-sm"
            title="Please create a project first">
            <Icon name="mdi:plus" class="w-4 h-4" />
            Create API
          </button>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center items-center py-12">
        <Icon name="mdi:loading" class="w-8 h-8 animate-spin text-indigo-500" />
      </div>

      <div v-else-if="error" class="bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-xl">
        {{ error }}
      </div>

      <div v-else-if="filteredApis.length === 0" class="bg-[#242736] rounded-xl shadow-lg p-12 text-center">
        <Icon name="mdi:api-off" class="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-300 mb-2">No APIs yet</h3>
        <p class="text-gray-400 mb-4 text-sm">Get started by creating your first API mock</p>
        <NuxtLink v-if="canWrite()" to="/api-mocks/new"
          :class="['inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2d3142] text-gray-300 rounded-full hover:bg-[#353849] transition-colors text-sm', !hasProjects ? 'pointer-events-none opacity-50 cursor-not-allowed' : '']">
          <Icon name="mdi:plus" class="w-4 h-4" />
          Create New
        </NuxtLink>
      </div>

      <div v-else class="bg-[#242736] rounded-xl shadow-lg overflow-y-auto">
        <table class="min-w-full divide-y divide-gray-700">
          <thead class="bg-[#1f2230]">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Sl.No
              </th>
              <th v-if="canWrite()" class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Order
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Endpoint
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Method
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Response
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Auth
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-[#242736] divide-y divide-gray-700">
            <template v-for="(group, groupIndex) in groupedApis" :key="group.groupName">
              <!-- Group Header Row -->
              <tr class="bg-[#1a1d2e] border-t-2 border-gray-600/50">
                <td colspan="8" class="px-6 py-3">
                  <div class="flex flex-row items-center gap-2 text-sm font-normal text-gray-300">
                    <Icon name="mdi:folder-outline" class="w-4 h-4" />
                    <!-- Even though unnamed apis come under Ungrouped, we will still show it as '-' -->
                    <span class="mt-0.5">{{ group.groupName === 'Ungrouped' ? '-' : group.groupName }}</span>
                    <span v-if="getGroupIsAdminPanelPage(group.groupName)" class="text-xs text-indigo-400 bg-indigo-900/30 px-1.5 py-0.5 rounded">Admin Page</span>
                    <button
                      v-if="canWrite() && group.groupName !== 'Ungrouped'"
                      @click="openGroupEditModal(group.groupName)"
                      class="mt-1 ml-2 text-gray-400 hover:text-indigo-400 transition-colors rounded"
                      title="Edit group"
                    >
                      <Icon name="mdi:pencil" class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
              <!-- API Rows in this group -->
              <template v-for="(api, apiIndex) in group.apis" :key="api.id">
                <tr class="hover:bg-[#2d3142] transition-colors">
                <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-300">
                  {{ filteredApis.findIndex(a => a.id === api.id) + 1 }}
                </td>
                <td v-if="canWrite()" class="px-6 py-3 whitespace-nowrap text-sm text-gray-300">
                  <div class="flex items-center gap-1">
                    <button @click="moveApiUp(api.id)" :disabled="filteredApis.findIndex(a => a.id === api.id) === 0"
                      class="text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up">
                      <Icon name="mdi:chevron-up" class="w-4 h-4" />
                    </button>
                    <button @click="moveApiDown(api.id)" :disabled="filteredApis.findIndex(a => a.id === api.id) === filteredApis.length - 1"
                      class="text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down">
                      <Icon name="mdi:chevron-down" class="w-4 h-4" />
                    </button>
                  </div>
                </td>
                <td class="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-300">
                  <div class="flex items-center gap-2">
                    <span class="max-w-[440px] overflow-y-auto">{{ api.endpoint }}</span>
                    <button @click="copyEndpoint(api.endpoint)"
                      class="text-gray-500 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy endpoint">
                      <Icon name="mdi:content-copy" class="w-4 h-4" />
                    </button>
                  </div>
                </td>
                <td class="px-6 py-3 whitespace-nowrap">
                  <span class="px-2 py-0.5 text-xs font-semibold rounded-full" :class="{
                    'bg-green-900/30 text-green-300': api.method === 'GET',
                    'bg-blue-900/30 text-blue-300': api.method === 'POST',
                    'bg-yellow-900/30 text-yellow-300': api.method === 'PUT',
                    'bg-red-900/30 text-red-300': api.method === 'DELETE',
                    'bg-purple-900/30 text-purple-300': api.method === 'PATCH',
                  }">
                    {{ api.method }}
                  </span>
                </td>
                <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-300">
                  <div class="relative inline-flex items-center gap-1" data-status-dropdown>
                    <span v-if="getActiveStatusCode(api)"
                      class="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-700 text-gray-300">
                      {{ getActiveStatusCode(api) }}
                    </span>
                    <span v-else class="text-gray-500">-</span>
                    <IconDropdown
                      v-if="canWrite()"
                      :options="getStatusDropdownOptions(api)"
                      title="Change active status"
                      @option-selected="(option) => changeActiveStatus(api, option.value as number)"
                    />
                  </div>
                </td>
                <td class="px-6 py-3 whitespace-nowrap">
                  <button v-if="canWrite()" @click="toggleEnabled(api.id)"
                    class="relative inline-flex h-4 w-7 items-center rounded-full transition-colors"
                    :class="api.enabled ? 'bg-indigo-600' : 'bg-gray-600'">
                    <span class="inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform"
                      :class="api.enabled ? 'translate-x-3.5' : 'translate-x-1'"></span>
                  </button>
                  <p v-else :class="['text-xs', api.enabled ? 'text-green-400' : 'text-red-400']">
                    {{ api.enabled ? 'Active' : 'Disabled' }}
                  </p>
                </td>
                <td class="px-6 py-3 whitespace-nowrap">
                  <button v-if="canWrite()" @click="toggleApiAuth(api.id)"
                    class="relative inline-flex h-4 w-7 items-center rounded-full transition-colors"
                    :class="api.isAuth ? 'bg-indigo-600' : 'bg-gray-600'">
                    <span class="inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform"
                      :class="api.isAuth ? 'translate-x-3.5' : 'translate-x-1'"></span>
                  </button>
                  <p v-else :class="['text-xs', api.isAuth ? 'text-green-400' : 'text-red-400']">
                    {{ api.isAuth ? 'Required' : 'Not Required' }}
                  </p>
                </td>
                <td class="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end gap-2">
                    <button @click="openApiPlayground(api)"
                      class="text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="API Playground">
                      <Icon name="icomoon-free:lab" class="w-4 h-4" />
                    </button>
                    <button @click="copyRequestData(api)"
                      class="text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy request data">
                      <Icon name="mdi:code-json" class="w-4 h-4" />
                    </button>
                    <NuxtLink v-if="canWrite()" :to="`/api-mocks/${api.id}`"
                      class="text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors">
                      <Icon name="mdi:pencil" class="w-4 h-4" />
                    </NuxtLink>
                    <button v-if="canDelete()" @click="handleDelete(api.id)"
                      class="text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors">
                      <Icon name="mdi:delete" class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
              </template>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Swagger Download -->
      <div v-if="filteredApis.length > 0" class="flex justify-end mt-3 px-6 py-3">
        <button @click="downloadSwaggerSpec"
          class="text-gray-400 hover:text-gray-300 flex items-center gap-1.5 text-sm transition-colors">
          <Icon name="material-symbols:download" class="w-4 h-4" />
          OpenAPI Spec
        </button>
      </div>

      <!-- Objects Section -->
      <div class="mt-16">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-medium text-gray-300">Objects</h2>
          <div class="flex items-center gap-2">
            <NuxtLink v-if="hasProjects && canWrite()" to="/objects/new"
              class="px-3 py-1.5 bg-[#2d3142] text-gray-300 rounded-full hover:bg-[#353849] transition-colors flex items-center gap-1.5 text-sm">
              <Icon name="mdi:plus" class="w-4 h-4" />
              Create Object
            </NuxtLink>
            <button v-else disabled
              class="px-3 py-1.5 bg-[#2d3142] text-gray-500 rounded-full cursor-not-allowed flex items-center gap-1.5 opacity-50 text-sm"
              title="Please create a project first">
              <Icon name="mdi:plus" class="w-4 h-4" />
              Create Object
            </button>
          </div>
        </div>

        <div v-if="objectsLoading" class="flex justify-center items-center py-12">
          <Icon name="mdi:loading" class="w-8 h-8 animate-spin text-indigo-500" />
        </div>

        <div v-else-if="objectsError" class="bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-xl">
          {{ objectsError }}
        </div>

        <div v-else-if="filteredObjects.length === 0" class="bg-[#242736] rounded-xl shadow-lg p-12 text-center">
          <Icon name="mdi:cube-outline" class="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-300 mb-2">No objects yet</h3>
          <p class="text-gray-400 mb-4 text-sm">Get started by creating your first object schema</p>
          <NuxtLink v-if="canWrite()" to="/objects/new"
            :class="['inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2d3142] text-gray-300 rounded-full hover:bg-[#353849] transition-colors text-sm', !hasProjects ? 'pointer-events-none opacity-50 cursor-not-allowed' : '']">
            <Icon name="mdi:plus" class="w-4 h-4" />
            Create Object
          </NuxtLink>
        </div>

        <div v-else class="bg-[#242736] rounded-xl shadow-lg overflow-y-auto">
          <table class="min-w-full divide-y divide-gray-700">
            <thead class="bg-[#1f2230]">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Sl.No
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Order
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <div>Name</div>
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Fields
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-[#242736] divide-y divide-gray-700">
              <tr v-for="(object, index) in filteredObjects" :key="object.id"
                class="hover:bg-[#2d3142] transition-colors">
                <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-300">
                  {{ index + 1 }}
                </td>
                <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-300">
                  <div class="flex items-center gap-1">
                    <button @click="moveObjectUp(object.id)" :disabled="index === 0"
                      class="text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up">
                      <Icon name="mdi:chevron-up" class="w-4 h-4" />
                    </button>
                    <button @click="moveObjectDown(object.id)" :disabled="index === filteredObjects.length - 1"
                      class="text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down">
                      <Icon name="mdi:chevron-down" class="w-4 h-4" />
                    </button>
                  </div>
                </td>
                <td class="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-300">
                  <span>{{ object.name }}</span><span v-if="object.isEntity" class="text-gray-400 ml-1">**</span>
                </td>
                <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-400">
                  {{ object.fields?.length || 0 }} field(s)
                </td>
                <td class="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end gap-2">
                    <button @click="copyObjectSchema(object)"
                      class="text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors"
                      title="Copy schema">
                      <Icon name="mdi:code-json" class="w-4 h-4" />
                    </button>
                    <NuxtLink :to="`/objects/${object.id}`"
                      class="text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors">
                      <Icon name="mdi:pencil" class="w-4 h-4" />
                    </NuxtLink>
                    <button @click="handleObjectDelete(object.id)"
                      class="text-gray-400 hover:text-gray-300 p-1 rounded hover:bg-[#353849] transition-colors">
                      <Icon name="mdi:delete" class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="filteredObjects.length > 0" class="w-full flex justify-between items-center mt-3">
          <p class="text-sm text-gray-400 mt-3"><span class="text-gray-400">**</span> - Indicates an entity</p>
          <div class="flex justify-between items-center gap-1">
            <p class="text-sm text-gray-400 mr-3">Markdown:</p>
            <p class="text-sm text-gray-400">Objects</p>
            <button @click="copyObjectsMarkdown"
              class="text-gray-300 mr-3">
              <Icon name="mdi:content-copy" class="w-3 h-3" />
            </button>
            <p class="text-sm text-gray-400">API Generation Prompt</p>
            <button @click="copyApiGenerationPromptMarkdown"
              class="text-gray-300 mr-3">
              <Icon name="mdi:content-copy" class="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <!-- Expose Local Server Section -->
      <div class="mt-12 flex flex-row items-center mb-4 cursor-pointer self-start grow-0" @click="showExposeServer = !showExposeServer">
        <h2 class="text-md font-medium text-gray-500">Expose your local server</h2>
        <button class="text-gray-400 hover:text-gray-300 transition-transform ml-3 mt-1">
          <Icon :name="`mingcute:${showExposeServer ? 'up' : 'down'}-line`" class="w-4 h-4" />
        </button>
      </div>
      <div class="mt-3">
        <div v-if="showExposeServer" class="bg-[#242736] rounded-xl shadow-lg p-6">
          <p class="text-gray-500 text-sm">We recommend using <strong class="text-gray-200">ngrok</strong> during testing.</p>
          <div class="mt-4">
            <p class="text-gray-400 text-sm mb-2">Usage: <code class="text-indigo-400 font-google-sans-code">ngrok http &lt;PORT&gt;</code></p>
            <p class="text-sm text-gray-400">
              For example: If <code class="text-indigo-400">.env</code> has <code class="text-indigo-400 font-google-sans-code">PORT=4001</code>,
              then run it on another terminal as:
            </p>
            <div class="flex items-center mt-2">
              <p class="text-sm text-indigo-400 font-google-sans-code">ngrok http 4001</p>
              <button @click="copyToClipboard('ngrok http 4001')"
                class="text-gray-400 ml-2 hover:text-gray-300 p-1 rounded transition-colors"
                title="Copy to clipboard">
                <Icon name="mdi:content-copy" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-center items-center w-full text-white text-xs gap-1.5 mt-24 mb-2">
        <Icon name="mdi:code" class="w-4 h-4" />
        <p>by
          <a href="https://in.linkedin.com/in/soumodippaul" target="_blank">Soumodip Paul</a>
        </p>
      </div>

      <ModalsProject :show="modal?.type === 'createProject'" :loading="projectStore.loading" @close="closeModal"
        @create="handleCreateProject" @upload="handleUploadProject" />

      <ModalsAskForPermission :show="modal?.type === 'deleteProject'" title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone." confirm-text="Delete"
        :loading="projectStore.loading" @confirm="handleDeleteProject" @cancel="closeModal" />

      <ModalsAskForPermission :show="modal?.type === 'deleteApi'" title="Delete API Mock"
        message="Are you sure you want to delete this API mock? This action cannot be undone." confirm-text="Delete"
        :loading="apiStore.loading" @confirm="handleDeleteApi" @cancel="closeModal" />

      <ModalsAskForPermission :show="modal?.type === 'deleteObject'" title="Delete Object"
        message="Are you sure you want to delete this object? This action cannot be undone." confirm-text="Delete"
        :loading="objectStore.loading" @confirm="handleDeleteObject" @cancel="closeModal" />

      <ModalsInfo :show="modal?.type === 'info'" @close="closeModal" />

      <ModalsProjectDownload :show="modal?.type === 'downloadProject'" :project-data="projectDownloadData"
        @close="closeModal" />

      <ModalsGroups :show="modal?.type === 'groups'" :project="selectedProject" @close="closeModal"
        @update="handleGroupUpdate" />

      <ModalsGroupEdit
        :show="modal?.type === 'groupEdit'"
        :project="selectedProject"
        :group-name="modal?.data?.groupName"
        @close="closeModal"
        @update="handleGroupUpdate" />

      <ModalsSwaggerUpload
        :show="modal?.type === 'swaggerUpload'"
        :project-id="projectStore.selectedProjectId || ''"
        @close="closeModal"
        @imported="handleSwaggerImported" />

      <ModalsApiPlayground
        :show="modal?.type === 'apiPlayground'"
        :api="modal?.data"
        :is-auth="modal?.data?.isAuth"
        :auth-headers="modal?.data?.authHeaders"
        @close="closeModal" />

      <ModalsGettingStarted
        v-if="modal?.type == 'getting-started'"
        :heading="gettingStartedData.heading"
        :youtube-video-link="gettingStartedData.youtubeVideoLink"
        :description="gettingStartedData.description"
        :is-sandbox="isDataResetEnabled"
        :next-reset-time="nextResetTime"
        @close="closeModal" />
    </div>

    <!-- Floating Info Button -->
    <div class="fixed bottom-6 right-6 flex items-center gap-2">
      <button @click="openModal('getting-started', null)"
        class="relative bg-[#2d3142] text-gray-300 rounded-xl shadow-lg transition-colors flex items-center justify-center w-10 h-10 hover:bg-[#353849]"
        title="Info">
        <Icon name="teenyicons:screen-outline" class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// Components
import HeaderContainer from '~/components/common/Header.vue';
// Stores
import { useApiStore } from '~/stores/api';
import { useObjectStore } from '~/stores/object';
import { useProjectStore, normalizeGroup } from '~/stores/project';
import type { AuthType, AuthConfig, ProjectGroup } from '~/stores/project';
// Composables
import { useDataReset } from '~/composables/useDataReset';
// Types
import type { Modal } from '~/types/index';

const apiStore = useApiStore();
const { apis, loading, error } = storeToRefs(apiStore);

const { canWrite, canDelete } = useAuth();

const objectStore = useObjectStore();
const { objects, loading: objectsLoading, error: objectsError } = storeToRefs(objectStore);

const projectStore = useProjectStore();
const appConfig = useAppConfig();

// Data reset (singleton — intervals are managed by DataResetOverlay in layout)
const { isDataResetEnabled, nextResetTime } = useDataReset();

const modal = ref<Modal | null>(null);
const accessTokenInput = ref('');
const authTypeInput = ref<AuthType | ''>('');
const authConfigInput = ref<AuthConfig>({});
const showExposeServer = ref(false);
const mockServerBaseUri = appConfig.baseUri || `http://localhost:4001`;

// Shining animation for Upload OpenAPI Spec button when new project is created
const showUploadButtonShine = ref(false);

// Getting Started Modal
const GETTING_STARTED_STORAGE_KEY = 'getting-started-modal-shown';
const gettingStartedData = {
  heading: 'Getting Started',
  youtubeVideoLink: 'https://youtu.be/hjq5W9-jh6I?t=0',
  description: 'Welcome to API Mocks! Watch this quick tutorial to get started with creating and managing your API mocks.'
};

// Password visibility states
const passwordVisibility = ref({
  basicPassword: false,
  digestPassword: false,
  oauth1ConsumerSecret: false,
  oauth1TokenSecret: false,
  oauth2ClientSecret: false,
  hawkKey: false,
  awsSecretAccessKey: false,
  akamaiClientSecret: false,
  jwtSecret: false,
});

const authTypeOptions = [
  { label: 'API Key', value: 'api-key' },
  { label: 'Bearer Token', value: 'bearer-token' },
  { label: 'Basic Auth', value: 'basic-auth' },
  { label: 'Digest Auth', value: 'digest-auth' },
  { label: 'OAuth 1.0', value: 'oauth1' },
  { label: 'OAuth 2.0', value: 'oauth2' },
  { label: 'Hawk Authentication', value: 'hawk' },
  { label: 'AWS Signature', value: 'aws-signature' },
  { label: 'Akamai EdgeGrid', value: 'akamai-edgegrid' },
  { label: 'JWT Bearer', value: 'jwt-bearer' },
];

const hasProjects = computed(() => projectStore.projects.length > 0);

const projectOptions = computed(() => {
  return projectStore.projects.map(project => ({
    label: project.name,
    value: project.id
  }));
});

const selectedProject = computed(() => {
  if (!projectStore.selectedProjectId) return null;
  return projectStore.projects.find(p => p.id === projectStore.selectedProjectId);
});

const filteredApis = computed(() => {
  if (!projectStore.selectedProjectId) return [];
  return apis.value
    .filter(api => api.projectId === projectStore.selectedProjectId)
    .sort((a, b) => {
      // Handle undefined apiIndex - treat as very high number to sort to end
      const aIndex = a.apiIndex ?? Number.MAX_SAFE_INTEGER;
      const bIndex = b.apiIndex ?? Number.MAX_SAFE_INTEGER;
      return aIndex - bIndex;
    });
});

const groupedApis = computed(() => {
  if (!projectStore.selectedProjectId) return [];

  // Group APIs by group name
  const groups = new Map<string, typeof filteredApis.value>();

  filteredApis.value.forEach(api => {
    const groupName = api.group || 'Ungrouped';
    if (!groups.has(groupName)) {
      groups.set(groupName, []);
    }
    groups.get(groupName)!.push(api);
  });

  // Convert to array and sort by minimum apiIndex in each group
  return Array.from(groups.entries())
    .map(([groupName, apis]) => ({
      groupName,
      apis,
      minIndex: Math.min(...apis.map(api => api.apiIndex ?? Number.MAX_SAFE_INTEGER))
    }))
    .sort((a, b) => a.minIndex - b.minIndex);
});

const filteredObjects = computed(() => {
  if (!projectStore.selectedProjectId) return [];
  return objects.value
    .filter(obj => obj.projectId === projectStore.selectedProjectId)
    .sort((a, b) => (a.objectIndex ?? 0) - (b.objectIndex ?? 0));
});

const projectDownloadData = computed(() => {
  if (!selectedProject.value) return { project: null, apis: [], objects: [] };
  return {
    project: selectedProject.value,
    apis: filteredApis.value,
    objects: filteredObjects.value,
  };
});

// Helper function to get isAdminPanelPage for a group name
const getGroupIsAdminPanelPage = (groupName: string): boolean => {
  if (!selectedProject.value?.groups || groupName === 'Ungrouped') return false;
  const group = selectedProject.value.groups.find(g => {
    const normalized = normalizeGroup(g);
    return normalized.name === groupName;
  });
  if (!group) return false;
  return normalizeGroup(group).isAdminPanelPage;
};

// Open group edit modal
const openGroupEditModal = (groupName: string) => {
  openModal('groupEdit', { groupName });
};

const basicAuthCombinedToken = computed(() => {
  if (authTypeInput.value !== 'basic-auth') return '';
  const { basicUsername, basicPassword } = authConfigInput.value;
  if (!basicUsername || !basicPassword) return '';
  return `Basic ${btoa(`${basicUsername}:${basicPassword}`)}`;
});

const digestAuthCombinedToken = computed(() => {
  if (authTypeInput.value !== 'digest-auth') return '';
  const { digestUsername, digestPassword, digestRealm } = authConfigInput.value;
  if (!digestUsername || !digestPassword) return '';
  const realmPart = digestRealm ? `, realm="${digestRealm}"` : '';
  return `Digest username="${digestUsername}", password="${digestPassword}"${realmPart}`;
});

const oauth1CombinedToken = computed(() => {
  if (authTypeInput.value !== 'oauth1') return '';
  const { oauth1ConsumerKey, oauth1ConsumerSecret, oauth1Token, oauth1TokenSecret } = authConfigInput.value;
  if (!oauth1ConsumerKey || !oauth1ConsumerSecret || !oauth1Token || !oauth1TokenSecret) return '';
  return `oauth_consumer_key="${oauth1ConsumerKey}", oauth_consumer_secret="${oauth1ConsumerSecret}", oauth_token="${oauth1Token}", oauth_token_secret="${oauth1TokenSecret}"`;
});

const hawkCombinedToken = computed(() => {
  if (authTypeInput.value !== 'hawk') return '';
  const { hawkId, hawkKey, hawkAlgorithm } = authConfigInput.value;
  if (!hawkId || !hawkKey) return '';
  const algorithmPart = hawkAlgorithm ? `, algorithm="${hawkAlgorithm}"` : '';
  return `Hawk id="${hawkId}", key="${hawkKey}"${algorithmPart}`;
});

const awsCombinedToken = computed(() => {
  if (authTypeInput.value !== 'aws-signature') return '';
  const { awsAccessKeyId, awsSecretAccessKey, awsRegion, awsService } = authConfigInput.value;
  if (!awsAccessKeyId || !awsSecretAccessKey) return '';
  const regionPart = awsRegion ? `, region="${awsRegion}"` : '';
  const servicePart = awsService ? `, service="${awsService}"` : '';
  return `AWS access_key_id="${awsAccessKeyId}", secret_access_key="${awsSecretAccessKey}"${regionPart}${servicePart}`;
});

const akamaiCombinedToken = computed(() => {
  if (authTypeInput.value !== 'akamai-edgegrid') return '';
  const { akamaiClientToken, akamaiClientSecret, akamaiAccessToken } = authConfigInput.value;
  if (!akamaiClientToken || !akamaiClientSecret || !akamaiAccessToken) return '';
  return `client_token="${akamaiClientToken}", client_secret="${akamaiClientSecret}", access_token="${akamaiAccessToken}"`;
});

const getActiveStatusCode = (api: any) => {
  if (!api.statusMocks || api.statusMocks.length === 0) return null;
  const activeStatus = api.statusMocks.find((sm: any) => sm.enabled);
  return activeStatus ? activeStatus.statusCode : null;
};

const getStatusDropdownOptions = (api: any) => {
  if (!api.statusMocks || api.statusMocks.length === 0) return [];
  return api.statusMocks.map((sm: any) => ({
    value: sm.statusCode,
    label: String(sm.statusCode),
    active: sm.enabled
  }));
};

const changeActiveStatus = async (api: any, statusCode: number) => {
  // Update statusMocks to set the selected status as enabled and others as disabled
  const updatedStatusMocks = api.statusMocks.map((sm: any) => ({
    ...sm,
    enabled: sm.statusCode === statusCode
  }));

  await apiStore.updateApi(api.id, {
    ...api,
    statusMocks: updatedStatusMocks
  });
};

onMounted(async () => {
  await projectStore.fetchProjects();
  apiStore.fetchApis();
  objectStore.fetchObjects();

  // Check if project_id is in URL and auto-select it
  const route = useRoute();
  const projectId = route.query.project_id;
  if (projectId && typeof projectId === 'string') {
    projectStore.selectedProjectId = projectId;
  }

  // Check if this is a newly created project and show upload button animation
  const isNewProject = route.query.new_project;
  if (isNewProject) {
    showUploadButtonShine.value = true;
    // Remove the new_project query param from URL without reload
    const router = useRouter();
    router.replace({ query: { project_id: projectId } });
    // Stop the animation after 3 seconds
    setTimeout(() => {
      showUploadButtonShine.value = false;
    }, 1500);
  }

  // Check if getting started modal was already shown
  if (typeof window !== 'undefined') {
    const hasSeenModal = localStorage.getItem(GETTING_STARTED_STORAGE_KEY);
    if (!hasSeenModal) {
      openModal('getting-started', null);
    }
  }

  // Update logo and title after 2 seconds
  setTimeout(() => {
    useHead({
      title: 'Mock APIs with ease.'
    });

    // Update favicon with cache busting
    if (typeof document !== 'undefined') {
      const links = document.querySelectorAll("link[rel*='icon']");
      links.forEach(link => link.remove());

      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.type = 'image/svg+xml';
      newLink.href = `/api-mocks-logo-base.svg?v=${Date.now()}`;
      document.head.appendChild(newLink);
    }
  }, 1000);
});

// Watch for selected project changes and update auth inputs
watch(selectedProject, (newProject) => {
  if (newProject && newProject.isAuth) {
    accessTokenInput.value = newProject.accessToken;
    authTypeInput.value = newProject.authType || 'bearer-token';
    authConfigInput.value = newProject.authConfig || {};
  } else {
    accessTokenInput.value = '';
    authTypeInput.value = '';
    authConfigInput.value = {};
  }
}, { immediate: true });

// Methods
const openModal = (type: string, data: any) => {
  modal.value = { type, data };
};

const closeModal = () => {
  if (modal.value?.type === 'getting-started') {
    if (typeof window !== 'undefined') {
      localStorage.setItem(GETTING_STARTED_STORAGE_KEY, 'true');
    }
  }
  modal.value = null;
};

const handleProjectChange = () => {
  // Update URL with project_id
  const router = useRouter();
  if (projectStore.selectedProjectId) {
    router.push({ query: { project_id: projectStore.selectedProjectId } });
  } else {
    router.push({ query: {} });
  }

  // Update auth inputs when project changes
  if (selectedProject.value && selectedProject.value.isAuth) {
    accessTokenInput.value = selectedProject.value.accessToken;
    authTypeInput.value = selectedProject.value.authType || 'bearer-token';
    authConfigInput.value = selectedProject.value.authConfig || {};
  } else {
    accessTokenInput.value = '';
    authTypeInput.value = '';
    authConfigInput.value = {};
  }
};

const handleAuthTypeChange = () => {
  // Reset auth config when type changes and set defaults
  authConfigInput.value = {};

  // Set default values for specific auth types
  if (authTypeInput.value === 'api-key') {
    authConfigInput.value.apiKeyHeader = 'X-API-Key';
  }
};

const generateGuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const toggleProjectAuth = async () => {
  if (!selectedProject.value) return;

  const newIsAuth = !selectedProject.value.isAuth;
  const newAccessToken = newIsAuth ? generateGuid() : '';
  const defaultAuthType: AuthType = 'bearer-token';
  const defaultAuthConfig: AuthConfig = { bearerToken: newAccessToken };

  try {
    await projectStore.updateProject(selectedProject.value.id, {
      name: selectedProject.value.name,
      isAuth: newIsAuth,
      accessToken: newAccessToken,
      authType: newIsAuth ? defaultAuthType : undefined,
      authConfig: newIsAuth ? defaultAuthConfig : undefined,
    });

    if (newIsAuth) {
      accessTokenInput.value = newAccessToken;
      authTypeInput.value = defaultAuthType;
      authConfigInput.value = defaultAuthConfig;
    } else {
      accessTokenInput.value = '';
      authTypeInput.value = '';
      authConfigInput.value = {};
    }
  } catch (error) {
    console.error('Failed to toggle auth:', error);
    alert('Failed to toggle auth');
  }
};

const updateAuthConfig = async () => {
  if (!selectedProject.value || !authTypeInput.value) return;

  try {
    // Determine the access token based on auth type
    let newAccessToken = selectedProject.value.accessToken;
    if (authTypeInput.value === 'bearer-token' && authConfigInput.value.bearerToken) {
      newAccessToken = authConfigInput.value.bearerToken;
    } else if (authTypeInput.value === 'api-key' && authConfigInput.value.apiKey) {
      newAccessToken = authConfigInput.value.apiKey;
    }

    // Clean up authConfig - remove empty/undefined values
    const cleanAuthConfig = Object.fromEntries(
      Object.entries(authConfigInput.value).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
    );

    const payload = {
      name: selectedProject.value.name,
      isAuth: selectedProject.value.isAuth,
      accessToken: newAccessToken,
      authType: authTypeInput.value as AuthType,
      authConfig: cleanAuthConfig,
    };

    console.log('Updating project with payload:', payload);

    await projectStore.updateProject(selectedProject.value.id, payload);

    console.log('Project updated successfully');
  } catch (error: any) {
    console.error('Failed to update auth config:', error);
    console.error('Error details:', error.data || error.message || error);
    alert(`Failed to update auth config: ${error.data?.message || error.message || 'Unknown error'}`);
  }
};

const regenerateBearerToken = async () => {
  if (!selectedProject.value) return;

  const newToken = generateGuid();
  authConfigInput.value.bearerToken = newToken;

  try {
    await projectStore.updateProject(selectedProject.value.id, {
      name: selectedProject.value.name,
      isAuth: selectedProject.value.isAuth,
      accessToken: newToken,
      authType: authTypeInput.value as AuthType,
      authConfig: authConfigInput.value,
    });
  } catch (error) {
    console.error('Failed to regenerate bearer token:', error);
    alert('Failed to regenerate bearer token');
  }
};

const copyAuthValue = async (field: keyof AuthConfig) => {
  const value = authConfigInput.value[field];
  if (!value) return;

  try {
    await navigator.clipboard.writeText(value.toString());
  } catch (error) {
    console.error('Failed to copy auth value:', error);
  }
};

const copyToClipboard = async (value: any) => {
  if (!value) return;

  try {
    await navigator.clipboard.writeText(value.toString());
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
  }
};

const regenerateAuthCredentials = async () => {
  if (!selectedProject.value || !authTypeInput.value) return;

  switch (authTypeInput.value) {
    case 'api-key':
      authConfigInput.value.apiKey = generateGuid();
      break;

    case 'bearer-token':
      authConfigInput.value.bearerToken = generateGuid();
      break;

    case 'basic-auth':
      authConfigInput.value.basicUsername = generateGuid();
      authConfigInput.value.basicPassword = generateGuid();
      break;

    case 'digest-auth':
      authConfigInput.value.digestUsername = generateGuid();
      authConfigInput.value.digestPassword = generateGuid();
      break;

    case 'oauth1':
      authConfigInput.value.oauth1ConsumerKey = generateGuid();
      authConfigInput.value.oauth1ConsumerSecret = generateGuid();
      authConfigInput.value.oauth1Token = generateGuid();
      authConfigInput.value.oauth1TokenSecret = generateGuid();
      break;

    case 'oauth2':
      authConfigInput.value.oauth2AccessToken = generateGuid();
      authConfigInput.value.oauth2ClientId = generateGuid();
      authConfigInput.value.oauth2ClientSecret = generateGuid();
      break;

    case 'hawk':
      authConfigInput.value.hawkId = generateGuid();
      authConfigInput.value.hawkKey = generateGuid();
      authConfigInput.value.hawkAlgorithm = 'sha256';
      break;

    case 'aws-signature':
      authConfigInput.value.awsAccessKeyId = generateGuid().substring(0, 20).toUpperCase();
      authConfigInput.value.awsSecretAccessKey = generateGuid();
      authConfigInput.value.awsRegion = 'us-east-1';
      authConfigInput.value.awsService = 's3';
      break;

    case 'akamai-edgegrid':
      authConfigInput.value.akamaiClientToken = generateGuid();
      authConfigInput.value.akamaiClientSecret = generateGuid();
      authConfigInput.value.akamaiAccessToken = generateGuid();
      break;

    case 'jwt-bearer':
      authConfigInput.value.jwtToken = generateGuid();
      authConfigInput.value.jwtSecret = generateGuid();
      break;
  }

  // Auto-update after regeneration
  try {
    // Determine the access token based on auth type
    let newAccessToken = selectedProject.value.accessToken;
    if (authTypeInput.value === 'bearer-token' && authConfigInput.value.bearerToken) {
      newAccessToken = authConfigInput.value.bearerToken;
    } else if (authTypeInput.value === 'api-key' && authConfigInput.value.apiKey) {
      newAccessToken = authConfigInput.value.apiKey;
    }

    // Clean up authConfig - remove empty/undefined values
    const cleanAuthConfig = Object.fromEntries(
      Object.entries(authConfigInput.value).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
    );

    await projectStore.updateProject(selectedProject.value.id, {
      name: selectedProject.value.name,
      isAuth: selectedProject.value.isAuth,
      accessToken: newAccessToken,
      authType: authTypeInput.value as AuthType,
      authConfig: cleanAuthConfig,
    });

    console.log('Auth credentials regenerated and updated successfully');
  } catch (error: any) {
    console.error('Failed to update after regeneration:', error);
    if (error?.data?.message) {
      console.error('Server error:', error.data.message);
    }
    alert(`Failed to update after regeneration: ${error.data?.message || error.message || 'Unknown error'}`);
  }
};

// Legacy method - kept for backward compatibility
const updateAccessToken = async () => {
  if (!selectedProject.value || !accessTokenInput.value) return;

  try {
    await projectStore.updateProject(selectedProject.value.id, {
      name: selectedProject.value.name,
      isAuth: selectedProject.value.isAuth,
      accessToken: accessTokenInput.value,
    });
  } catch (error) {
    console.error('Failed to update access token:', error);
    alert('Failed to update access token');
  }
};

const regenerateAccessToken = async () => {
  if (!selectedProject.value) return;

  const newAccessToken = generateGuid();

  try {
    await projectStore.updateProject(selectedProject.value.id, {
      name: selectedProject.value.name,
      isAuth: selectedProject.value.isAuth,
      accessToken: newAccessToken,
    });

    accessTokenInput.value = newAccessToken;
  } catch (error) {
    console.error('Failed to regenerate access token:', error);
    alert('Failed to regenerate access token');
  }
};

const copyAccessToken = async () => {
  if (!accessTokenInput.value) return;

  try {
    await navigator.clipboard.writeText(accessTokenInput.value);
  } catch (error) {
    console.error('Failed to copy access token:', error);
  }
};

const handleCreateProject = async (name: string) => {
  try {
    const newProject = await projectStore.createProject({ name } as any);

    // Auto-create a sandbox integration for the new project
    await $fetch('/api/integrations', {
      method: 'POST',
      body: {
        name: 'sandbox',
        projectId: newProject.id,
      },
    });

    closeModal();

    // Reload the page with the new project selected (new_project flag triggers upload button animation)
    window.location.href = `/?project_id=${newProject.id}&new_project=1`;
  } catch (error) {
    console.error('Failed to create project:', error);
    alert('Failed to create project');
  }
};

const handleUploadProject = async (data: { project: any; apis: any[]; objects: any[] }) => {
  try {
    // Call the bulk import API
    const response = await $fetch('/api/projects', {
      method: 'POST',
      body: data,
    });

    // Refresh all stores
    await projectStore.fetchProjects();
    await apiStore.fetchApis();
    await objectStore.fetchObjects();

    closeModal();
  } catch (error) {
    console.error('Failed to upload project:', error);
    alert('Failed to upload project');
  }
};

const handleDeleteProject = async () => {
  if (!projectStore.selectedProjectId) return;
  try {
    await projectStore.deleteProject(projectStore.selectedProjectId);
    closeModal();
  } catch (error) {
    console.error('Failed to delete project:', error);
    alert('Failed to delete project');
  }
};

const handleGroupUpdate = async () => {
  try {
    await projectStore.fetchProjects();
    await apiStore.fetchApis();
  } catch (error) {
    console.error('Failed to refresh after group update:', error);
  }
};

const handleSwaggerImported = async (count: number) => {
  console.log(`Successfully imported ${count} APIs from Swagger`);
  try {
    await apiStore.fetchApis();
    await projectStore.fetchProjects();
  } catch (error) {
    console.error('Failed to refresh data after import:', error);
  }
};

const downloadPostmanCollection = () => {
  if (!projectStore.selectedProjectId) return;

  const selectedProject = projectStore.projects.find(p => p.id === projectStore.selectedProjectId);
  if (!selectedProject) return;

  // Helper function to build Postman auth object based on auth type
  const buildPostmanAuth = (authType: string, authConfig: AuthConfig) => {
    switch (authType) {
      case 'api-key':
        return {
          type: 'apikey',
          apikey: [
            {
              key: 'key',
              value: authConfig.apiKeyHeader || 'X-API-Key',
              type: 'string',
            },
            {
              key: 'value',
              value: authConfig.apiKey || '',
              type: 'string',
            },
            {
              key: 'in',
              value: 'header',
              type: 'string',
            },
          ],
        };

      case 'bearer-token':
        return {
          type: 'bearer',
          bearer: [
            {
              key: 'token',
              value: authConfig.bearerToken || '',
              type: 'string',
            },
          ],
        };

      case 'basic-auth':
        return {
          type: 'basic',
          basic: [
            {
              key: 'username',
              value: authConfig.basicUsername || '',
              type: 'string',
            },
            {
              key: 'password',
              value: authConfig.basicPassword || '',
              type: 'string',
            },
          ],
        };

      case 'digest-auth':
        return {
          type: 'digest',
          digest: [
            {
              key: 'username',
              value: authConfig.digestUsername || '',
              type: 'string',
            },
            {
              key: 'password',
              value: authConfig.digestPassword || '',
              type: 'string',
            },
            ...(authConfig.digestRealm ? [{
              key: 'realm',
              value: authConfig.digestRealm,
              type: 'string',
            }] : []),
          ],
        };

      case 'oauth1':
        return {
          type: 'oauth1',
          oauth1: [
            {
              key: 'consumerKey',
              value: authConfig.oauth1ConsumerKey || '',
              type: 'string',
            },
            {
              key: 'consumerSecret',
              value: authConfig.oauth1ConsumerSecret || '',
              type: 'string',
            },
            {
              key: 'token',
              value: authConfig.oauth1Token || '',
              type: 'string',
            },
            {
              key: 'tokenSecret',
              value: authConfig.oauth1TokenSecret || '',
              type: 'string',
            },
            {
              key: 'signatureMethod',
              value: 'HMAC-SHA1',
              type: 'string',
            },
          ],
        };

      case 'oauth2':
        return {
          type: 'oauth2',
          oauth2: [
            {
              key: 'accessToken',
              value: authConfig.oauth2AccessToken || '',
              type: 'string',
            },
            {
              key: 'addTokenTo',
              value: 'header',
              type: 'string',
            },
            ...(authConfig.oauth2ClientId ? [{
              key: 'clientId',
              value: authConfig.oauth2ClientId,
              type: 'string',
            }] : []),
            ...(authConfig.oauth2ClientSecret ? [{
              key: 'clientSecret',
              value: authConfig.oauth2ClientSecret,
              type: 'string',
            }] : []),
          ],
        };

      case 'hawk':
        return {
          type: 'hawk',
          hawk: [
            {
              key: 'authId',
              value: authConfig.hawkId || '',
              type: 'string',
            },
            {
              key: 'authKey',
              value: authConfig.hawkKey || '',
              type: 'string',
            },
            {
              key: 'algorithm',
              value: authConfig.hawkAlgorithm || 'sha256',
              type: 'string',
            },
          ],
        };

      case 'aws-signature':
        return {
          type: 'awsv4',
          awsv4: [
            {
              key: 'accessKey',
              value: authConfig.awsAccessKeyId || '',
              type: 'string',
            },
            {
              key: 'secretKey',
              value: authConfig.awsSecretAccessKey || '',
              type: 'string',
            },
            {
              key: 'region',
              value: authConfig.awsRegion || 'us-east-1',
              type: 'string',
            },
            {
              key: 'service',
              value: authConfig.awsService || 's3',
              type: 'string',
            },
          ],
        };

      case 'akamai-edgegrid':
        return {
          type: 'edgegrid',
          edgegrid: [
            {
              key: 'accessToken',
              value: authConfig.akamaiAccessToken || '',
              type: 'string',
            },
            {
              key: 'clientToken',
              value: authConfig.akamaiClientToken || '',
              type: 'string',
            },
            {
              key: 'clientSecret',
              value: authConfig.akamaiClientSecret || '',
              type: 'string',
            },
          ],
        };

      case 'jwt-bearer':
        return {
          type: 'bearer',
          bearer: [
            {
              key: 'token',
              value: authConfig.jwtToken || '',
              type: 'string',
            },
          ],
        };

      default:
        return { type: 'noauth' };
    }
  };

  // Group APIs by their group name
  const groups = new Map<string, typeof filteredApis.value>();
  filteredApis.value.forEach(api => {
    const groupName = api.group || 'Ungrouped';
    if (!groups.has(groupName)) {
      groups.set(groupName, []);
    }
    groups.get(groupName)!.push(api);
  });

  // Helper function to create a request item from an API
  const createRequestItem = (api: any) => {
    // Get active status mock for params
    const activeStatusMock = api.statusMocks?.find((sm: any) => sm.enabled);

    const headers: any[] = [
      {
        key: 'Content-Type',
        value: 'application/json',
        type: 'text',
      },
    ];

    // Add header params from active status mock
    if (activeStatusMock?.headerParams && activeStatusMock.headerParams.length > 0) {
      activeStatusMock.headerParams.forEach((param: any) => {
        headers.push({
          key: param.key,
          value: param.type === 'number' ? '0' : param.type === 'boolean' ? 'false' : '',
          type: 'text',
        });
      });
    }

    // Build query params from active status mock
    const queryParams: any[] = [];
    if (activeStatusMock?.queryParams && activeStatusMock.queryParams.length > 0) {
      activeStatusMock.queryParams.forEach((param: any) => {
        queryParams.push({
          key: param.key,
          value: param.type === 'number' ? '0' : param.type === 'boolean' ? 'false' : '',
        });
      });
    }

    const requestConfig: any = {
      method: api.method,
      header: headers,
      url: {
        raw: `{{base_url}}${api.endpoint}`,
        host: ['{{base_url}}'],
        path: api.endpoint.split('/').filter(Boolean),
      },
    };

    // Add query params to URL config
    if (queryParams.length > 0) {
      requestConfig.url.query = queryParams;
    }

    // Add auth at route level if the API has auth enabled
    if (api.isAuth && selectedProject.isAuth && selectedProject.authType) {
      requestConfig.auth = buildPostmanAuth(selectedProject.authType, selectedProject.authConfig || {});
    } else if (api.isAuth && selectedProject.isAuth) {
      // Fallback to bearer token if no authType is specified
      requestConfig.auth = {
        type: 'bearer',
        bearer: [
          {
            key: 'token',
            value: selectedProject.accessToken || '',
            type: 'string',
          },
        ],
      };
    } else {
      // Explicitly set no auth for routes that don't require it
      requestConfig.auth = { type: 'noauth' };
    }

    // Add body params from active status mock
    if (activeStatusMock?.bodyParams && activeStatusMock.bodyParams.length > 0) {
      requestConfig.body = {
        mode: 'raw',
        raw: JSON.stringify(
          activeStatusMock.bodyParams.reduce((acc: any, param: any) => {
            acc[param.key] = param.type === 'number' ? 0 : param.type === 'boolean' ? false : '';
            return acc;
          }, {}),
          null,
          2
        ),
        options: {
          raw: {
            language: 'json',
          },
        },
      };
    }

    return {
      name: `${api.method} ${api.endpoint}`,
      request: requestConfig,
    };
  };

  // Create collection items grouped by group name
  const collectionItems = Array.from(groups.entries()).map(([groupName, apis]) => ({
    name: groupName,
    item: apis.map(createRequestItem),
  }));

  const collection: any = {
    info: {
      name: selectedProject.name,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      description: selectedProject.isAuth
        ? `API Collection for ${selectedProject.name}. Authentication is enabled at project level.`
        : `API Collection for ${selectedProject.name}`,
    },
    variable: [
      {
        key: 'base_url',
        value: `${mockServerBaseUri}/api/projects/${selectedProject.id}`,
        type: 'string',
      },
    ],
    item: collectionItems,
  };

  // Add auth at collection level (project level) if enabled
  if (selectedProject.isAuth && selectedProject.authType) {
    collection.auth = buildPostmanAuth(selectedProject.authType, selectedProject.authConfig || {});
  } else if (selectedProject.isAuth) {
    // Fallback to bearer token if no authType is specified
    collection.auth = {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: selectedProject.accessToken || '',
          type: 'string',
        },
      ],
    };
  }

  const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${selectedProject.name.replace(/\s+/g, '_')}_postman_collection.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const downloadProject = () => {
  if (!projectStore.selectedProjectId) return;

  const selectedProject = projectStore.projects.find(p => p.id === projectStore.selectedProjectId);
  if (!selectedProject) return;

  const projectData = {
    project: selectedProject,
    apis: filteredApis.value,
    objects: filteredObjects.value,
  };

  const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${selectedProject.name.replace(/\s+/g, '_')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const downloadSwaggerSpec = () => {
  if (!projectStore.selectedProjectId) return;

  const project = projectStore.projects.find(p => p.id === projectStore.selectedProjectId);
  if (!project) return;

  // Build OpenAPI 3.0 security schemes based on auth type
  const buildSecuritySchemes = (authType: string, authConfig: AuthConfig): Record<string, any> => {
    switch (authType) {
      case 'api-key':
        return {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: authConfig.apiKeyHeader || 'X-API-Key',
          },
        };
      case 'bearer-token':
        return {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
          },
        };
      case 'basic-auth':
        return {
          BasicAuth: {
            type: 'http',
            scheme: 'basic',
          },
        };
      case 'digest-auth':
        return {
          DigestAuth: {
            type: 'http',
            scheme: 'digest',
          },
        };
      case 'oauth1':
        return {
          OAuth1: {
            type: 'http',
            scheme: 'oauth',
            description: 'OAuth 1.0 authentication',
          },
        };
      case 'oauth2':
        return {
          OAuth2: {
            type: 'oauth2',
            flows: {
              clientCredentials: {
                tokenUrl: authConfig.oauth2TokenUrl || '/oauth/token',
                scopes: {},
              },
            },
          },
        };
      case 'jwt-bearer':
        return {
          JWTBearer: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        };
      default:
        return {};
    }
  };

  // Get security requirement array based on auth type
  const getSecurityRequirement = (authType: string): any[] => {
    switch (authType) {
      case 'api-key':
        return [{ ApiKeyAuth: [] }];
      case 'bearer-token':
        return [{ BearerAuth: [] }];
      case 'basic-auth':
        return [{ BasicAuth: [] }];
      case 'digest-auth':
        return [{ DigestAuth: [] }];
      case 'oauth1':
        return [{ OAuth1: [] }];
      case 'oauth2':
        return [{ OAuth2: [] }];
      case 'jwt-bearer':
        return [{ JWTBearer: [] }];
      default:
        return [];
    }
  };

  // Convert param type to OpenAPI schema type
  const paramTypeToSchema = (type: string): any => {
    switch (type) {
      case 'number':
        return { type: 'number' };
      case 'boolean':
        return { type: 'boolean' };
      case 'array':
        return { type: 'array', items: { type: 'string' } };
      case 'object':
        return { type: 'object' };
      default:
        return { type: 'string' };
    }
  };

  // Extract path parameters from endpoint
  const extractPathParams = (endpoint: string): string[] => {
    const params: string[] = [];
    // Match both :paramName and {paramName} formats
    const colonMatches = endpoint.match(/:([a-zA-Z_][a-zA-Z0-9_]*)/g);
    const braceMatches = endpoint.match(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g);

    if (colonMatches) {
      colonMatches.forEach(match => params.push(match.slice(1)));
    }
    if (braceMatches) {
      braceMatches.forEach(match => params.push(match.slice(1, -1)));
    }
    return params;
  };

  // Normalize endpoint to OpenAPI format (use {param} style)
  const normalizeEndpoint = (endpoint: string): string => {
    return endpoint.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, '{$1}');
  };

  // Try to parse JSON response and generate schema
  const generateResponseSchema = (responseValue: string | undefined): any => {
    if (!responseValue) {
      return { type: 'object' };
    }

    try {
      const parsed = JSON.parse(responseValue);
      return inferSchema(parsed);
    } catch {
      // If not valid JSON, treat as string
      return { type: 'string' };
    }
  };

  // Infer schema from a value
  const inferSchema = (value: any): any => {
    if (value === null) {
      return { type: 'string', nullable: true };
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return { type: 'array', items: { type: 'object' } };
      }
      return { type: 'array', items: inferSchema(value[0]) };
    }
    if (typeof value === 'object') {
      const properties: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) {
        properties[key] = inferSchema(val);
      }
      return { type: 'object', properties };
    }
    if (typeof value === 'number') {
      return Number.isInteger(value) ? { type: 'integer' } : { type: 'number' };
    }
    if (typeof value === 'boolean') {
      return { type: 'boolean' };
    }
    return { type: 'string' };
  };

  // Group APIs by their group name (for tags)
  const allGroups = new Set<string>();
  filteredApis.value.forEach(api => {
    allGroups.add(api.group || 'default');
  });

  // Build paths object
  const paths: Record<string, any> = {};

  filteredApis.value.forEach(api => {
    const normalizedPath = normalizeEndpoint(api.endpoint);
    const pathParams = extractPathParams(api.endpoint);
    const method = api.method.toLowerCase();

    if (!paths[normalizedPath]) {
      paths[normalizedPath] = {};
    }

    // Get active status mock for primary response
    const activeStatusMock = api.statusMocks?.find((sm: any) => sm.enabled);

    // Build parameters array
    const parameters: any[] = [];

    // Add path parameters
    pathParams.forEach(paramName => {
      parameters.push({
        name: paramName,
        in: 'path',
        required: true,
        schema: { type: 'string' },
      });
    });

    // Add header parameters from active status mock
    if (activeStatusMock?.headerParams) {
      activeStatusMock.headerParams.forEach((param: any) => {
        parameters.push({
          name: param.key,
          in: 'header',
          required: param.required || false,
          schema: paramTypeToSchema(param.type),
        });
      });
    }

    // Add query parameters from active status mock
    if (activeStatusMock?.queryParams) {
      activeStatusMock.queryParams.forEach((param: any) => {
        parameters.push({
          name: param.key,
          in: 'query',
          required: param.required || false,
          schema: paramTypeToSchema(param.type),
        });
      });
    }

    // Build request body if there are body params
    let requestBody: any = undefined;
    if (activeStatusMock?.bodyParams && activeStatusMock.bodyParams.length > 0) {
      const properties: Record<string, any> = {};
      const required: string[] = [];

      activeStatusMock.bodyParams.forEach((param: any) => {
        properties[param.key] = paramTypeToSchema(param.type);
        if (param.required) {
          required.push(param.key);
        }
      });

      requestBody = {
        required: required.length > 0,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties,
              ...(required.length > 0 && { required }),
            },
          },
        },
      };
    }

    // Build responses object
    const responses: Record<string, any> = {};

    api.statusMocks?.forEach((statusMock: any) => {
      const statusCode = String(statusMock.statusCode);
      const isSuccess = statusMock.statusCode >= 200 && statusMock.statusCode < 300;

      responses[statusCode] = {
        description: isSuccess ? 'Successful response' : `Error response (${statusCode})`,
        content: {
          'application/json': {
            schema: generateResponseSchema(statusMock.responseValue),
          },
        },
      };
    });

    // Add default response if no responses defined
    if (Object.keys(responses).length === 0) {
      responses['200'] = {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: { type: 'object' },
          },
        },
      };
    }

    // Build operation object
    const operation: any = {
      tags: [api.group || 'default'],
      summary: api.description || `${api.method} ${api.endpoint}`,
      operationId: `${method}${normalizedPath.replace(/[{}\/]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')}`,
      ...(parameters.length > 0 && { parameters }),
      ...(requestBody && { requestBody }),
      responses,
    };

    // Add security requirement if API requires auth
    if (api.isAuth && project.isAuth && project.authType) {
      operation.security = getSecurityRequirement(project.authType);
    } else if (!api.isAuth) {
      // Explicitly no security for public endpoints
      operation.security = [];
    }

    paths[normalizedPath][method] = operation;
  });

  // Build tags array
  const tags = Array.from(allGroups).map(group => ({
    name: group,
    description: `${group} endpoints`,
  }));

  // Build the complete OpenAPI spec
  const openApiSpec: any = {
    openapi: '3.0.3',
    info: {
      title: project.name,
      description: `API specification for ${project.name}`,
      version: '1.0.0',
    },
    servers: [
      {
        url: `${mockServerBaseUri}/api/projects/${project.id}`,
        description: 'Mock Server',
      },
    ],
    tags,
    paths,
  };

  // Add security schemes and global security if auth is enabled
  if (project.isAuth && project.authType) {
    openApiSpec.components = {
      securitySchemes: buildSecuritySchemes(project.authType, project.authConfig || {}),
    };
  }

  // Download the file
  const blob = new Blob([JSON.stringify(openApiSpec, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.replace(/\s+/g, '_')}_openapi.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const toggleEnabled = async (id: string) => {
  await apiStore.toggleEnabled(id);
};

const toggleApiAuth = async (id: string) => {
  const api = apiStore.apis.find(a => a.id === id);
  if (!api) return;

  try {
    await apiStore.updateApi(id, {
      ...api,
      isAuth: !api.isAuth,
    });
  } catch (error) {
    console.error('Failed to toggle API auth:', error);
  }
};

const openApiPlayground = (api: any) => {
  const authHeaders: Record<string, string> = {};

  // Build auth headers if the API requires auth and project has auth configured
  if (api.isAuth && selectedProject.value?.isAuth && selectedProject.value?.authType && selectedProject.value?.authConfig) {
    const authType = selectedProject.value.authType;
    const authConfig = selectedProject.value.authConfig;

    switch (authType) {
      case 'api-key':
        if (authConfig.apiKey && authConfig.apiKeyHeader) {
          authHeaders[authConfig.apiKeyHeader] = authConfig.apiKey;
        }
        break;

      case 'bearer-token':
        if (authConfig.bearerToken) {
          authHeaders['Authorization'] = `Bearer ${authConfig.bearerToken}`;
        }
        break;

      case 'basic-auth':
        if (authConfig.basicUsername && authConfig.basicPassword) {
          const credentials = btoa(`${authConfig.basicUsername}:${authConfig.basicPassword}`);
          authHeaders['Authorization'] = `Basic ${credentials}`;
        }
        break;

      case 'digest-auth':
        // Digest auth requires server challenge, so we'll just add a note
        if (authConfig.digestUsername) {
          authHeaders['X-Digest-Username'] = authConfig.digestUsername;
        }
        break;

      case 'oauth1':
        if (authConfig.oauth1ConsumerKey && authConfig.oauth1ConsumerSecret) {
          // Generate OAuth 1.0 signature
          const timestamp = Math.floor(Date.now() / 1000).toString();
          const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

          const oauthParams: Record<string, string> = {
            oauth_consumer_key: authConfig.oauth1ConsumerKey,
            oauth_signature_method: 'HMAC-SHA1',
            oauth_timestamp: timestamp,
            oauth_nonce: nonce,
            oauth_version: '1.0'
          };

          if (authConfig.oauth1Token) {
            oauthParams.oauth_token = authConfig.oauth1Token;
          }

          // Build signature base string
          const baseUrl = `${window.location.origin}/api${api.endpoint}`;
          const sortedParams = Object.keys(oauthParams).sort().map(key =>
            `${encodeURIComponent(key)}=${encodeURIComponent(oauthParams[key]!)}`
          ).join('&');

          const signatureBaseString = `${api.method.toUpperCase()}&${encodeURIComponent(baseUrl)}&${encodeURIComponent(sortedParams)}`;

          // Create signing key
          const consumerSecret = authConfig.oauth1ConsumerSecret || '';
          const tokenSecret = authConfig.oauth1TokenSecret || '';
          const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;

          // Generate HMAC-SHA1 signature using Web Crypto API (async, but we'll use sync approach)
          // For simplicity in the UI, we'll send params without signature and rely on backend mock mode
          // In production, you'd use crypto.subtle.importKey + crypto.subtle.sign

          // Build Authorization header
          const headerParts = Object.keys(oauthParams).sort().map(key =>
            `${key}="${encodeURIComponent(oauthParams[key]!)}"`
          );
          authHeaders['Authorization'] = `OAuth ${headerParts.join(', ')}`;
        }
        break;

      case 'oauth2':
        if (authConfig.oauth2AccessToken) {
          authHeaders['Authorization'] = `Bearer ${authConfig.oauth2AccessToken}`;
        }
        break;

      case 'hawk':
        if (authConfig.hawkId && authConfig.hawkKey) {
          // Generate Hawk Authentication header
          const timestamp = Math.floor(Date.now() / 1000).toString();
          const nonce = Math.random().toString(36).substring(2, 15);

          // Build the normalized request string for MAC calculation
          // Format: hawk.1.header\n{timestamp}\n{nonce}\n{method}\n{uri}\n{host}\n{port}\n\n{ext}\n
          const url = new URL(`${window.location.origin}/api${api.endpoint}`);
          const method = api.method.toUpperCase();
          const uri = url.pathname + url.search;
          const host = url.hostname;
          const port = url.port || (url.protocol === 'https:' ? '443' : '80');
          const algorithm = authConfig.hawkAlgorithm || 'sha256';

          // Create normalized request string
          const normalizedString = `hawk.1.header\n${timestamp}\n${nonce}\n${method}\n${uri}\n${host}\n${port}\n\n\n`;

          // Generate MAC using HMAC
          const encoder = new TextEncoder();
          const keyData = encoder.encode(authConfig.hawkKey);
          const messageData = encoder.encode(normalizedString);

          // Use crypto.subtle for HMAC (we'll simplify by creating basic header without full crypto)
          // For the playground, we'll send simplified hawk header
          const hawkParams = [
            `id="${authConfig.hawkId}"`,
            `ts="${timestamp}"`,
            `nonce="${nonce}"`,
          ];

          authHeaders['Authorization'] = `Hawk ${hawkParams.join(', ')}`;
        }
        break;

      case 'aws-signature':
        if (authConfig.awsAccessKeyId && authConfig.awsSecretAccessKey) {
          // Generate AWS Signature V4 Authorization header
          // For playground purposes, we create a simplified but valid AWS Signature V4 header
          const awsRegion = authConfig.awsRegion || 'us-east-1';
          const awsService = authConfig.awsService || 'execute-api';
          const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '').substring(0, 8);

          // Create credential scope: YYYYMMDD/region/service/aws4_request
          const credentialScope = `${timestamp}/${awsRegion}/${awsService}/aws4_request`;

          // Generate a mock signature (in real AWS, this would be HMAC-SHA256 of canonical request)
          // For mock server purposes, we create a valid-looking hex signature
          const mockSignature = Array.from({ length: 64 }, () =>
            Math.floor(Math.random() * 16).toString(16)
          ).join('');

          // Build AWS Signature V4 Authorization header
          // Format: AWS4-HMAC-SHA256 Credential={access_key}/{credential_scope}, SignedHeaders={headers}, Signature={signature}
          authHeaders['Authorization'] = `AWS4-HMAC-SHA256 Credential=${authConfig.awsAccessKeyId}/${credentialScope}, SignedHeaders=host;x-amz-date, Signature=${mockSignature}`;

          // Add required AWS headers
          authHeaders['X-Amz-Date'] = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
        }
        break;

      case 'akamai-edgegrid':
        if (authConfig.akamaiClientToken && authConfig.akamaiClientSecret && authConfig.akamaiAccessToken) {
          // Generate Akamai EdgeGrid Authorization header
          // Format: EG1-HMAC-SHA256 client_token={token};access_token={token};timestamp={timestamp};nonce={nonce};signature={signature}
          const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, '+0000');
          const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

          // For mock server purposes, we create a valid-looking signature without actual HMAC
          // In real EdgeGrid, signature = Base64(HMAC-SHA256(signing_key, data_to_sign))
          const mockSignature = Array.from({ length: 43 }, () =>
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'[Math.floor(Math.random() * 64)]
          ).join('') + '=';

          // Build EdgeGrid Authorization header
          authHeaders['Authorization'] = `EG1-HMAC-SHA256 client_token=${authConfig.akamaiClientToken};access_token=${authConfig.akamaiAccessToken};timestamp=${timestamp};nonce=${nonce};signature=${mockSignature}`;
        }
        break;

      case 'jwt-bearer':
        if (authConfig.jwtToken) {
          authHeaders['Authorization'] = `Bearer ${authConfig.jwtToken}`;
        }
        break;
    }
  }

  openModal('apiPlayground', {
    endpoint: api.endpoint,
    method: api.method,
    projectId: api.projectId,
    description: api.description,
    isAuth: api.isAuth,
    contentType: api.contentType,
    authHeaders: Object.keys(authHeaders).length > 0 ? authHeaders : undefined,
  });
};

const handleDelete = (id: string) => {
  openModal('deleteApi', id);
};

const handleDeleteApi = async () => {
  if (!modal.value?.data) return;
  try {
    await apiStore.deleteApi(modal.value.data);
    closeModal();
  } catch (error) {
    console.error('Failed to delete API:', error);
    alert('Failed to delete API');
  }
};

const copyEndpoint = async (endpoint: string) => {
  try {
    await navigator.clipboard.writeText(`${mockServerBaseUri}/api/projects/${selectedProject.value!.id}${endpoint}`);
  } catch (error) {
    console.error('Failed to copy endpoint:', error);
  }
};

const copyRequestData = async (api: any) => {
  try {
    const data: any = {};

    // Get active status mock
    const activeStatusMock = api.statusMocks?.find((sm: any) => sm.enabled);
    if (!activeStatusMock) {
      await navigator.clipboard.writeText(JSON.stringify({}, null, 2));
      return;
    }

    if (activeStatusMock.queryParams && activeStatusMock.queryParams.length > 0) {
      activeStatusMock.queryParams.forEach((param: any) => {
        let value;
        switch (param.type) {
          case 'number':
            value = 0;
            break;
          case 'boolean':
            value = false;
            break;
          default:
            value = '';
        }
        data[param.key] = value;
      });
    }

    if (activeStatusMock.bodyParams && activeStatusMock.bodyParams.length > 0) {
      activeStatusMock.bodyParams.forEach((param: any) => {
        let value;
        switch (param.type) {
          case 'number':
            value = 0;
            break;
          case 'boolean':
            value = false;
            break;
          default:
            value = '';
        }
        data[param.key] = value;
      });
    }

    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to copy request data:', error);
  }
};

const handleObjectDelete = (id: string) => {
  openModal('deleteObject', id);
};

const handleDeleteObject = async () => {
  if (!modal.value?.data) return;
  try {
    await objectStore.deleteObject(modal.value.data);
    closeModal();
  } catch (error) {
    console.error('Failed to delete object:', error);
    alert('Failed to delete object');
  }
};

const copyObjectSchema = async (object: any) => {
  try {
    const schema: any = {};

    if (object.fields && object.fields.length > 0) {
      object.fields.forEach((field: any) => {
        let value;
        switch (field.type) {
          case 'number':
            value = 0;
            break;
          case 'boolean':
            value = false;
            break;
          case 'object':
            value = field.ref ? `{ref: ${field.ref}}` : {};
            break;
          default:
            value = '';
        }
        schema[field.name] = value;
      });
    }

    await navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
  } catch (error) {
    console.error('Failed to copy object schema:', error);
  }
};

const copyObjectsMarkdown = async () => {
  try {
    let markdown = '';

    filteredObjects.value.forEach((object: any) => {
      markdown += `## ${object.name}\n\n`;

      if (object.fields && object.fields.length > 0) {
        object.fields.forEach((field: any) => {
          let fieldType = field.type;

          // Handle arrays
          if (field.isArray) {
            if (field.type === 'object' && field.ref) {
              const refObject = objects.value.find(obj => obj.id === field.ref);
              fieldType = refObject ? `${refObject.name}[]` : `${field.ref}[]`;
            } else {
              fieldType = `${field.type}[]`;
            }
          }
          // Handle object references
          else if (field.type === 'object' && field.ref) {
            const refObject = objects.value.find(obj => obj.id === field.ref);
            fieldType = refObject ? refObject.name : field.ref;
          }

          markdown += `${field.name} ${fieldType}\n`;
        });
      }

      markdown += '\n\n';
    });

    await navigator.clipboard.writeText(markdown.trim());
  } catch (error) {
    console.error('Failed to copy objects markdown:', error);
  }
};

const copyApiGenerationPromptMarkdown = async () => {
  try {
    let prompt = `You are supposed to generate a swagger file.\n\n`;
    prompt += `These are the API endpoints:\n//List all your APIs here\n`;

    prompt += `\nThere are my Model reference:\n\n`;

    // Add all objects with their fields
    filteredObjects.value.forEach((object: any) => {
      prompt += `## ${object.name}\n`;

      if (object.fields && object.fields.length > 0) {
        object.fields.forEach((field: any) => {
          let fieldType = field.type;

          // Handle arrays
          if (field.isArray) {
            if (field.type === 'object' && field.ref) {
              const refObject = objects.value.find(obj => obj.id === field.ref);
              fieldType = refObject ? `${refObject.name}[]` : `${field.ref}[]`;
            } else {
              fieldType = `${field.type}[]`;
            }
          }
          // Handle object references
          else if (field.type === 'object' && field.ref) {
            const refObject = objects.value.find(obj => obj.id === field.ref);
            fieldType = refObject ? refObject.name : field.ref;
          }

          prompt += `${field.name} ${fieldType}\n`;
        });
      }

      prompt += '\n';
    });

    await navigator.clipboard.writeText(prompt.trim());
  } catch (error) {
    console.error('Failed to copy API generation prompt markdown:', error);
  }
};

const moveApiUp = async (id: string) => {
  const currentIndex = filteredApis.value.findIndex(a => a.id === id);
  if (currentIndex <= 0) return;

  const currentApi = filteredApis.value[currentIndex]!;
  const prevApi = filteredApis.value[currentIndex - 1]!;

  try {
    // Swap apiIndex values
    await apiStore.updateApi(currentApi.id, { apiIndex: prevApi.apiIndex });
    await apiStore.updateApi(prevApi.id, { apiIndex: currentApi.apiIndex });

    // Refresh the list
    await apiStore.fetchApis();
  } catch (error) {
    console.error('Failed to move API up:', error);
  }
};

const moveApiDown = async (id: string) => {
  const currentIndex = filteredApis.value.findIndex(a => a.id === id);
  if (currentIndex < 0 || currentIndex >= filteredApis.value.length - 1) return;

  const currentApi = filteredApis.value[currentIndex]!;
  const nextApi = filteredApis.value[currentIndex + 1]!;

  try {
    // Swap apiIndex values
    await apiStore.updateApi(currentApi.id, { apiIndex: nextApi.apiIndex });
    await apiStore.updateApi(nextApi.id, { apiIndex: currentApi.apiIndex });

    // Refresh the list
    await apiStore.fetchApis();
  } catch (error) {
    console.error('Failed to move API down:', error);
  }
};

const moveObjectUp = async (id: string) => {
  // Find the visual position in the filtered/sorted array
  const currentVisualIndex = filteredObjects.value.findIndex(o => o.id === id);
  if (currentVisualIndex <= 0) return; // Already at top or not found

  const currentObject = filteredObjects.value[currentVisualIndex]!;
  const toBeInterchangedObject = filteredObjects.value[currentVisualIndex === 0 ? filteredObjects.value.length - 1 : currentVisualIndex - 1]!;

  try {
    await objectStore.updateObject(currentObject.id, { objectIndex: currentVisualIndex === 0 ? filteredObjects.value.length - 1 : currentVisualIndex - 1 });
    await objectStore.updateObject(toBeInterchangedObject.id, { objectIndex: currentVisualIndex })
    

    await objectStore.fetchObjects();
  } catch (error) {
    console.error('Failed to move object up:', error);
  }
};

const moveObjectDown = async (id: string) => {
  // Find the visual position in the filtered/sorted array
  const currentVisualIndex = filteredObjects.value.findIndex(o => o.id === id);
  if (currentVisualIndex < 0 || currentVisualIndex >= filteredObjects.value.length - 1) return; // At bottom or not found

  const currentObject = filteredObjects.value[currentVisualIndex]!;
  const toBeInterchangedObject = filteredObjects.value[currentVisualIndex === filteredObjects.value.length - 1 ? 0 : currentVisualIndex + 1]!;

  try {
    await objectStore.updateObject(currentObject.id, { objectIndex: currentVisualIndex === filteredObjects.value.length - 1 ? 0 : currentVisualIndex + 1 });
    await objectStore.updateObject(toBeInterchangedObject.id, { objectIndex: currentVisualIndex });

    await objectStore.fetchObjects();
  } catch (error) {
    console.error('Failed to move object down:', error);
  }
};
</script>

<style scoped>
.upload-button-shine {
  position: relative;
  animation: shimmer-border 0.8s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(79, 70, 229, 0.4), 0 0 16px rgba(67, 56, 202, 0.2);
}

.upload-button-shine::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(79, 70, 229, 0.5),
    rgba(99, 102, 241, 0.6),
    rgba(79, 70, 229, 0.5),
    transparent
  );
  border-radius: 9999px;
  z-index: -1;
  animation: shine-rotate 1.2s linear infinite;
  background-size: 200% 100%;
}

@keyframes shimmer-border {
  0%, 100% {
    box-shadow: 0 0 8px rgba(79, 70, 229, 0.3), 0 0 16px rgba(67, 56, 202, 0.15);
  }
  50% {
    box-shadow: 0 0 12px rgba(99, 102, 241, 0.5), 0 0 24px rgba(79, 70, 229, 0.3);
  }
}

@keyframes shine-rotate {
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
}
</style>