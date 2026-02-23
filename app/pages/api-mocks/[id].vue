<template>
  <div v-if="canWrite()" class="min-h-screen bg-[#1a1d2e] p-6">
    <ModalsProjectSelector
      :show="showProjectSelector"
      @close="handleProjectSelectorClose"
      @select="handleProjectSelect"
    />

    <!-- Error Modal -->
    <div v-if="showErrorModal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div class="bg-[#242736] rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-700">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-medium text-gray-200">Error</h2>
            <button @click="handleErrorModalClose" class="text-gray-400 hover:text-gray-300">
              <Icon name="mdi:close" class="w-5 h-5" />
            </button>
          </div>
          <div class="text-gray-300 text-sm">
            <p>{{ errorMessage }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-4xl mx-auto">
      <div class="mb-6 flex justify-between items-center">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-1.5 text-gray-300 hover:text-gray-100 transition-colors text-sm"
        >
          <Icon name="weui:back-filled" class="w-4 h-4" />
          Back
        </NuxtLink>
        <button v-if="isAuthEnabled" @click="handleLogout" class="inline-flex items-center gap-1.5 text-gray-300 hover:text-red-400 transition-colors text-xs">
          <Icon name="ic:baseline-logout" class="w-4 h-4" />
          Logout
        </button>
      </div>

      <div class="bg-[#242736] rounded-xl shadow-lg p-6">
        <h1 class="text-xl font-medium text-gray-200 mb-6">
          {{ isNew ? 'Create New API Mock' : 'Edit API Mock' }}
        </h1>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Endpoint <span class="text-red-400">*</span>
            </label>
            <input
              v-model="form.endpoint"
              type="text"
              placeholder="/api/users"
              class="w-full px-3 py-2 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Group
            </label>
            <div class="flex gap-2">
              <CommonDropdown
                v-model="form.group"
                :options="groupOptions"
                placeholder="Select or create group"
                class="flex-1"
              />
              <button
                v-if="showCreateGroupInput"
                type="button"
                @click="cancelCreateGroup"
                class="px-3 py-2 bg-[#2d3142] text-gray-300 rounded-full hover:bg-[#353849] transition-colors text-sm whitespace-nowrap"
              >
                Cancel
              </button>
            </div>
            <div v-if="showCreateGroupInput" class="mt-2 flex gap-2">
              <input
                v-model="newGroupName"
                type="text"
                placeholder="Enter new group name"
                class="flex-1 px-3 py-2 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500"
                @keyup.enter="createGroup"
              />
              <button
                type="button"
                @click="createGroup"
                class="px-3 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors text-sm whitespace-nowrap"
              >
                Create
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Name
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="e.g., Get User Profile"
              class="w-full px-3 py-2 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <div
              contenteditable="true"
              @input="handleDescriptionInput"
              @blur="handleDescriptionBlur"
              ref="descriptionEditor"
              class="w-full px-3 py-2 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm min-h-[75px] max-h-[200px] overflow-y-auto"
              :data-placeholder="form.description ? '' : 'Describe what this API endpoint does...'"
            ></div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Method <span class="text-red-400">*</span>
            </label>
            <CommonDropdown
              v-model="form.method"
              :options="methodOptions"
              placeholder="Select method"
            />
          </div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              @click="form.enabled = !form.enabled"
              class="relative inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-200"
              :class="form.enabled
                ? 'bg-indigo-600 border-indigo-600'
                : 'bg-[#2d3142] border-gray-600 hover:border-gray-500'"
            >
              <Icon
                name="mdi:check"
                class="w-4 h-4 text-white transition-all duration-200"
                :class="form.enabled ? 'opacity-100 scale-100' : 'opacity-0 scale-0'"
              />
            </button>
            <label class="text-sm font-medium text-gray-300 cursor-pointer" @click="form.enabled = !form.enabled">
              Enable this API mock
            </label>
          </div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              @click="form.isAuth = !form.isAuth"
              class="relative inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-200"
              :class="form.isAuth
                ? 'bg-indigo-600 border-indigo-600'
                : 'bg-[#2d3142] border-gray-600 hover:border-gray-500'"
            >
              <Icon
                name="mdi:check"
                class="w-4 h-4 text-white transition-all duration-200"
                :class="form.isAuth ? 'opacity-100 scale-100' : 'opacity-0 scale-0'"
              />
            </button>
            <label class="text-sm font-medium text-gray-300 cursor-pointer" @click="form.isAuth = !form.isAuth">
              Enable Auth
            </label>
          </div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              @click="form.isAdminEndpoint = !form.isAdminEndpoint"
              class="relative inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-200"
              :class="form.isAdminEndpoint
                ? 'bg-indigo-600 border-indigo-600'
                : 'bg-[#2d3142] border-gray-600 hover:border-gray-500'"
            >
              <Icon
                name="mdi:check"
                class="w-4 h-4 text-white transition-all duration-200"
                :class="form.isAdminEndpoint ? 'opacity-100 scale-100' : 'opacity-0 scale-0'"
              />
            </button>
            <label class="text-sm font-medium text-gray-300 cursor-pointer" @click="form.isAdminEndpoint = !form.isAdminEndpoint">
              Is Admin Endpoint?
            </label>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Content Type
            </label>
            <CommonDropdown
              v-model="form.contentType"
              :options="contentTypeOptions"
              placeholder="Select content type"
            />
            <p class="mt-2 text-sm text-gray-400">
              The content type determines how the request body will be parsed.
            </p>
          </div>

          <!-- Status Mocks Section -->
          <div class="border-t border-gray-600 pt-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-medium text-gray-200">Status Code Configurations</h2>
              <button
                type="button"
                @click="addStatusMock"
                class="px-3 py-1.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors flex items-center gap-1.5 text-sm"
              >
                <Icon name="mdi:plus" class="w-4 h-4" />
                Add Status Code
              </button>
            </div>

            <div v-if="form.statusMocks.length === 0" class="text-center py-8 text-gray-400 text-sm">
              No status codes configured. Add at least one status code.
            </div>

            <div v-else class="space-y-6">
              <div
                v-for="(statusMock, index) in form.statusMocks"
                :key="index"
                class="border rounded-xl p-4 space-y-4"
                :class="statusMock.enabled ? 'border-indigo-600 bg-[#2d3142]' : 'border-gray-600 bg-[#1f2230]'"
              >
                <div class="flex justify-between items-start">
                  <div class="flex items-center gap-3">
                    <button
                      type="button"
                      @click="toggleStatusMockEnabled(index)"
                      class="relative inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-200"
                      :class="statusMock.enabled
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'bg-[#2d3142] border-gray-600 hover:border-gray-500'"
                    >
                      <Icon
                        name="mdi:check"
                        class="w-4 h-4 text-white transition-all duration-200"
                        :class="statusMock.enabled ? 'opacity-100 scale-100' : 'opacity-0 scale-0'"
                      />
                    </button>
                    <h3 class="font-medium text-gray-200 text-sm">
                      Status {{ statusMock.statusCode }} {{ statusMock.enabled ? '(Active)' : '' }}
                    </h3>
                  </div>
                  <button
                    type="button"
                    @click="removeStatusMock(index)"
                    class="p-1.5 text-red-400 rounded transition-colors"
                  >
                    <Icon name="mdi:delete" class="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">
                    Status Code
                  </label>
                  <div v-if="!statusMock.isCustom">
                    <CommonDropdown
                      v-model="statusMock.statusCode"
                      :options="statusCodeOptions"
                      placeholder="Select status code"
                      @change="(val) => handleStatusChange(index, val)"
                    />
                  </div>
                  <div v-else class="flex gap-2">
                    <input
                      v-model.number="statusMock.statusCode"
                      type="number"
                      placeholder="Enter custom status code"
                      class="flex-1 px-3 py-2 border border-gray-600 bg-[#353849] text-gray-200 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500"
                    />
                    <button
                      type="button"
                      @click="statusMock.isCustom = false; statusMock.statusCode = 200"
                      class="px-3 py-2 bg-[#2d3142] text-gray-300 rounded-full hover:bg-[#353849] transition-colors text-sm whitespace-nowrap"
                    >
                      Back to Presets
                    </button>
                  </div>
                </div>

                <div>
                  <div class="flex justify-between items-center mb-2">
                    <label class="block text-sm font-medium text-gray-300">
                      Header Parameters
                    </label>
                    <button
                      type="button"
                      @click="addHeaderParam(index)"
                      class="text-sm text-gray-300 hover:text-gray-100 flex items-center gap-1"
                    >
                      <Icon name="mdi:plus" class="w-4 h-4" />
                      Add Parameter
                    </button>
                  </div>
                  <div v-if="statusMock.headerParams && statusMock.headerParams.length > 0" class="space-y-2">
                    <div
                      v-for="(param, pIndex) in statusMock.headerParams"
                      :key="pIndex"
                      class="flex gap-2 items-start"
                    >
                      <input
                        v-model="param.key"
                        type="text"
                        placeholder="Key"
                        class="flex-1 px-3 py-2 border border-gray-600 bg-[#353849] text-gray-200 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500"
                      />
                      <CommonDropdown
                        v-model="param.type"
                        :options="paramTypeOptions"
                        placeholder="Type"
                      />
                      <label class="flex items-center gap-2 px-3 py-2 cursor-pointer">
                        <button
                          type="button"
                          @click="param.required = !param.required"
                          class="relative inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-200"
                          :class="param.required
                            ? 'bg-indigo-600 border-indigo-600'
                            : 'bg-[#2d3142] border-gray-600 hover:border-gray-500'"
                        >
                          <Icon
                            name="mdi:check"
                            class="w-4 h-4 text-white transition-all duration-200"
                            :class="param.required ? 'opacity-100 scale-100' : 'opacity-0 scale-0'"
                          />
                        </button>
                        <span class="text-sm text-gray-300">Required</span>
                      </label>
                      <button
                        type="button"
                        @click="removeHeaderParam(index, pIndex)"
                        class="p-1.5 text-red-400 rounded transition-colors"
                      >
                        <Icon name="mdi:delete" class="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <div class="flex justify-between items-center mb-2">
                    <label class="block text-sm font-medium text-gray-300">
                      Query Parameters
                    </label>
                    <button
                      type="button"
                      @click="addQueryParam(index)"
                      class="text-sm text-gray-300 hover:text-gray-100 flex items-center gap-1"
                    >
                      <Icon name="mdi:plus" class="w-4 h-4" />
                      Add Parameter
                    </button>
                  </div>
                  <div v-if="statusMock.queryParams && statusMock.queryParams.length > 0" class="space-y-2">
                    <div
                      v-for="(param, pIndex) in statusMock.queryParams"
                      :key="pIndex"
                      class="flex gap-2 items-start"
                    >
                      <input
                        v-model="param.key"
                        type="text"
                        placeholder="Key"
                        class="flex-1 px-3 py-2 border border-gray-600 bg-[#353849] text-gray-200 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500"
                      />
                      <CommonDropdown
                        v-model="param.type"
                        :options="paramTypeOptions"
                        placeholder="Type"
                      />
                      <label class="flex items-center gap-2 px-3 py-2 cursor-pointer">
                        <button
                          type="button"
                          @click="param.required = !param.required"
                          class="relative inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-200"
                          :class="param.required
                            ? 'bg-indigo-600 border-indigo-600'
                            : 'bg-[#2d3142] border-gray-600 hover:border-gray-500'"
                        >
                          <Icon
                            name="mdi:check"
                            class="w-4 h-4 text-white transition-all duration-200"
                            :class="param.required ? 'opacity-100 scale-100' : 'opacity-0 scale-0'"
                          />
                        </button>
                        <span class="text-sm text-gray-300">Required</span>
                      </label>
                      <button
                        type="button"
                        @click="removeQueryParam(index, pIndex)"
                        class="p-1.5 text-red-400 rounded transition-colors"
                      >
                        <Icon name="mdi:delete" class="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <div class="flex justify-between items-center mb-2">
                    <label class="block text-sm font-medium text-gray-300">
                      Body Parameters
                    </label>
                    <button
                      type="button"
                      @click="addBodyParam(index)"
                      class="text-sm text-gray-300 hover:text-gray-100 flex items-center gap-1"
                    >
                      <Icon name="mdi:plus" class="w-4 h-4" />
                      Add Parameter
                    </button>
                  </div>
                  <div v-if="statusMock.bodyParams && statusMock.bodyParams.length > 0" class="space-y-2">
                    <div
                      v-for="(param, pIndex) in statusMock.bodyParams"
                      :key="pIndex"
                      class="flex gap-2 items-start"
                    >
                      <input
                        v-model="param.key"
                        type="text"
                        placeholder="Key"
                        class="flex-1 px-3 py-2 border border-gray-600 bg-[#353849] text-gray-200 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500"
                      />
                      <CommonDropdown
                        v-model="param.type"
                        :options="paramTypeOptions"
                        placeholder="Type"
                      />
                      <label class="flex items-center gap-2 px-3 py-2 cursor-pointer">
                        <button
                          type="button"
                          @click="param.required = !param.required"
                          class="relative inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-200"
                          :class="param.required
                            ? 'bg-indigo-600 border-indigo-600'
                            : 'bg-[#2d3142] border-gray-600 hover:border-gray-500'"
                        >
                          <Icon
                            name="mdi:check"
                            class="w-4 h-4 text-white transition-all duration-200"
                            :class="param.required ? 'opacity-100 scale-100' : 'opacity-0 scale-0'"
                          />
                        </button>
                        <span class="text-sm text-gray-300">Required</span>
                      </label>
                      <button
                        type="button"
                        @click="removeBodyParam(index, pIndex)"
                        class="p-1.5 text-red-400 rounded transition-colors"
                      >
                        <Icon name="mdi:delete" class="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <div class="flex justify-between items-center mb-2">
                    <label class="block text-sm font-medium text-gray-300">
                      Validators
                    </label>
                    <button
                      type="button"
                      @click="addValidator(index)"
                      class="text-sm text-gray-300 hover:text-gray-100 flex items-center gap-1"
                    >
                      <Icon name="mdi:plus" class="w-4 h-4" />
                      Add Validator
                    </button>
                  </div>
                  <div v-if="statusMock.validators && statusMock.validators.length > 0" class="space-y-2">
                    <div
                      v-for="(validator, vIndex) in statusMock.validators"
                      :key="vIndex"
                      class="flex gap-2 items-center"
                    >
                      <input
                        v-model="validator.field"
                        type="text"
                        placeholder="Field"
                        class="w-24 shrink-0 px-3 py-2 border border-gray-600 bg-[#353849] text-gray-200 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500"
                      />
                      <div class="w-32 shrink-0">
                        <CommonDropdown
                          v-model="(validator as any).type"
                          :options="validatorTypeOptions"
                          placeholder="Type"
                          :compact="true"
                        />
                      </div>
                      <input
                        v-model="(validator as any).value"
                        type="text"
                        :placeholder="getValidatorPlaceholder((validator as any).type)"
                        class="flex-1 min-w-0 px-3 py-2 border border-gray-600 bg-[#353849] text-gray-200 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder-gray-500"
                      />
                      <button
                        type="button"
                        @click="removeValidator(index, vIndex)"
                        class="p-1.5 text-red-400 rounded transition-colors shrink-0"
                      >
                        <Icon name="mdi:delete" class="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">
                    Response Object <span class="text-red-400">*</span>
                  </label>
                  <CommonDropdown
                    v-model="statusMock.responseObjectId"
                    :options="objectOptions"
                    placeholder="Select an object"
                    @change="() => handleResponseObjectChange(index)"
                  />
                  <p class="mt-2 text-sm text-gray-400">
                    Response will be generated based on the selected object schema.
                    <NuxtLink to="/objects/new" class="text-indigo-400 hover:text-indigo-300">
                      Manage objects
                    </NuxtLink>
                  </p>
                </div>

                <div v-if="statusMock.responseObjectId">
                  <div class="flex justify-between items-center mb-2">
                    <label class="block text-sm font-medium text-gray-300">
                      Response Value <span class="text-red-400">*</span>
                    </label>
                    <div class="flex items-center gap-2">
                      <button
                        v-if="statusMock.responseObjectId === 'json-only'"
                        type="button"
                        @click="toggleAIPanel(index)"
                        class="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        <Icon name="carbon:data-bin" class="w-4 h-4" />
                        Regenerate with AI
                      </button>
                      <button
                        v-if="statusMock.responseObjectId !== 'text-only' && statusMock.responseObjectId !== 'json-only'"
                        type="button"
                        @click="generateResponseValue(index)"
                        class="text-sm text-gray-300 hover:text-gray-100 flex items-center gap-1"
                      >
                        <Icon name="mdi:refresh" class="w-4 h-4" />
                        Regenerate
                      </button>
                    </div>
                  </div>
                  <div class="relative">
                    <textarea
                      v-model="statusMock.responseValue"
                      rows="12"
                      class="w-full px-3 py-2 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm placeholder-gray-500"
                      :placeholder="statusMock.responseObjectId === 'text-only' ? 'Enter any text response (can be null, undefined, or plain text)...' : statusMock.responseObjectId === 'json-only' ? 'Enter JSON response object...' : 'Response JSON will appear here...'"
                    />
                    <button
                      v-if="statusMock.responseObjectId === 'json-only'"
                      type="button"
                      @click="beautifyResponseJson(index)"
                      class="absolute top-2 right-2 px-1 pt-1 text-indigo-400 hover:text-indigo-300 bg-[#1a1d2e] rounded-lg transition-colors"
                      title="Beautify JSON"
                    >
                      <Icon name="hugeicons:ai-beautify" class="w-4 h-4" />
                    </button>
                  </div>
                  <!-- AI Regeneration Panel -->
                  <PopulateResponseStatusData
                    v-if="aiPanelIndex === index"
                    :method="form.method"
                    :endpoint="form.endpoint"
                    :status-code="statusMock.statusCode"
                    :current-response="statusMock.responseValue || ''"
                    @cancel="aiPanelIndex = null"
                    @generated="(val) => handleAIGenerated(index, val)"
                  />
                  <p class="mt-2 text-sm text-gray-400">
                    {{ statusMock.responseObjectId === 'text-only'
                      ? 'Enter any text, null, undefined, or leave empty for plain text response.'
                      : statusMock.responseObjectId === 'json-only'
                      ? 'Enter a valid JSON object that will be returned as the response.'
                      : 'Edit the JSON response that will be returned by this API endpoint.' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Error Response Section (Common to all status codes) -->
          <div class="border-t border-gray-600 pt-6">
            <h2 class="text-lg font-medium text-gray-200 mb-4">Error Response (400)</h2>
            <p class="text-sm text-gray-400 mb-4">
              This error response will be returned when validation fails for any active status code.
            </p>

            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Error Response Object <span class="text-red-400">*</span>
              </label>
              <CommonDropdown
                v-model="form.errorResponseObjectId"
                :options="objectOptions"
                placeholder="Select an object"
                @change="handleErrorResponseObjectChange"
              />
              <p class="mt-2 text-sm text-gray-400">
                Error response will be generated when validation fails.
                <NuxtLink to="/objects/new" class="text-indigo-400 hover:text-indigo-300">
                  Manage objects
                </NuxtLink>
              </p>
            </div>

            <div v-if="form.errorResponseObjectId" class="mt-4">
              <div class="flex justify-between items-center mb-2">
                <label class="block text-sm font-medium text-gray-300">
                  Error Response Value <span class="text-red-400">*</span>
                </label>
                <button
                  v-if="form.errorResponseObjectId !== 'text-only' && form.errorResponseObjectId !== 'json-only'"
                  type="button"
                  @click="generateErrorResponseValue"
                  class="text-sm text-gray-300 hover:text-gray-100 flex items-center gap-1"
                >
                  <Icon name="mdi:refresh" class="w-4 h-4" />
                  Regenerate
                </button>
              </div>
              <div class="relative">
                <textarea
                  v-model="form.errorResponseValue"
                  rows="12"
                  class="w-full px-3 py-2 border border-gray-600 bg-[#2d3142] text-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm placeholder-gray-500"
                  :placeholder="form.errorResponseObjectId === 'text-only' ? 'Enter any text error response (can be null, undefined, or plain text)...' : form.errorResponseObjectId === 'json-only' ? 'Enter JSON error response object...' : 'Error response JSON will appear here...'"
                />
                <button
                  v-if="form.errorResponseObjectId === 'json-only'"
                  type="button"
                  @click="beautifyErrorResponseJson"
                  class="absolute top-2 right-2 px-1 pt-1 text-indigo-400 hover:text-indigo-300 bg-[#1a1d2e] rounded-lg transition-colors"
                  title="Beautify JSON"
                >
                  <Icon name="hugeicons:ai-beautify" class="w-4 h-4" />
                </button>
              </div>
              <p class="mt-2 text-sm text-gray-400">
                {{ form.errorResponseObjectId === 'text-only'
                  ? 'Enter any text, null, undefined, or leave empty for plain text error response.'
                  : form.errorResponseObjectId === 'json-only'
                  ? 'Enter a valid JSON object that will be returned as the error response.'
                  : 'Edit the JSON error response that will be returned when validation fails.' }}
              </p>
            </div>
          </div>

          <div class="flex gap-2">
            <button
              type="submit"
              :disabled="loading"
              class="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-sm"
            >
              <Icon v-if="loading" name="mdi:loading" class="w-4 h-4 animate-spin" />
              <span>{{ isNew ? 'Create' : 'Update' }}</span>
            </button>
            <NuxtLink
              to="/"
              class="px-3 py-2 bg-[#2d3142] text-gray-300 rounded-full hover:bg-[#353849] transition-colors text-center text-sm"
            >
              Cancel
            </NuxtLink>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApiStore } from '~/stores/api';
import { useObjectStore } from '~/stores/object';
import { useProjectStore, getGroupName } from '~/stores/project';
import type { Param, Validator, StatusMock } from '~/stores/api';
import { generateMockData } from '~/utils/generateMockData';

const route = useRoute();
const router = useRouter();
const apiStore = useApiStore();
const descriptionEditor = ref<HTMLDivElement | null>(null);

// Auth composable
const { logout, isAuthEnabled } = useAuth();

const handleLogout = () => {
  logout();
};
const objectStore = useObjectStore();
const projectStore = useProjectStore();

const { canWrite, canDelete } = useAuth();
const toast = useToast();

const isNew = computed(() => route.params.id === 'new');
const loading = ref(false);
const aiPanelIndex = ref<number | null>(null);

const toggleAIPanel = (index: number) => {
  aiPanelIndex.value = aiPanelIndex.value === index ? null : index;
};

const handleAIGenerated = (index: number, responseValue: string) => {
  form.statusMocks[index]!.responseValue = responseValue;
  aiPanelIndex.value = null;
};
const showProjectSelector = ref(false);
const showErrorModal = ref(false);
const errorMessage = ref('');

const commonStatusCodes = [200, 201, 204, 400, 401, 403, 404, 500];

const methodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' },
];

const statusCodeOptions = [
  { label: '200 - OK', value: 200 },
  { label: '201 - Created', value: 201 },
  { label: '204 - No Content', value: 204 },
  { label: '400 - Bad Request', value: 400 },
  { label: '401 - Unauthorized', value: 401 },
  { label: '403 - Forbidden', value: 403 },
  { label: '404 - Not Found', value: 404 },
  { label: '500 - Internal Server Error', value: 500 },
  { label: 'Custom Status', value: 'custom' },
];

const paramTypeOptions = [
  { label: 'String', value: 'string' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Array', value: 'array' },
  { label: 'Object', value: 'object' },
];

const validatorTypeOptions = [
  { label: 'Exact Match', value: '' },
  { label: 'Equals', value: 'equals:' },
  { label: 'Not Equals', value: 'notEquals:' },
  { label: 'Min Length', value: 'minLength:' },
  { label: 'Max Length', value: 'maxLength:' },
  { label: 'Length', value: 'length:' },
  { label: 'Min (numeric)', value: 'min:' },
  { label: 'Max (numeric)', value: 'max:' },
  { label: 'Email', value: 'email:' },
];

// Helper to parse validator rule and extract type prefix
const parseValidatorRule = (rule: string): { type: string; value: string } => {
  const prefixes = ['equals:', 'notEquals:', 'minLength:', 'maxLength:', 'length:', 'min:', 'max:', 'email:'];
  for (const prefix of prefixes) {
    if (rule.startsWith(prefix)) {
      return { type: prefix, value: rule.substring(prefix.length) };
    }
  }
  // Special case for email without domain
  if (rule === 'email') {
    return { type: 'email:', value: '' };
  }
  return { type: '', value: rule };
};

// Helper to build validator rule from type and value
const buildValidatorRule = (type: string, value: string): string => {
  if (type === 'email:' && !value) {
    return 'email';
  }
  return type + value;
};

// Helper to get placeholder text based on validator type
const getValidatorPlaceholder = (type: string): string => {
  switch (type) {
    case 'equals:':
    case 'notEquals:':
      return 'Value to match';
    case 'minLength:':
    case 'maxLength:':
    case 'length:':
      return 'Character count';
    case 'min:':
    case 'max:':
      return 'Numeric value';
    case 'email:':
      return 'Domain (optional)';
    default:
      return 'Exact value to match';
  }
};

const objectOptions = computed(() => {
  // Filter objects to only show those from the same project
  const projectObjects = objectStore.objects
    .filter(obj => obj.projectId === projectStore.selectedProjectId)
    .map(obj => ({
      label: obj.name,
      value: obj.id
    }));

  return [
    ...projectObjects,
    { label: 'Text', value: 'text-only' },
    { label: 'JSON', value: 'json-only' }
  ];
});

const groupOptions = computed(() => {
  const currentProject = projectStore.projects.find(p => p.id === projectStore.selectedProjectId);
  const existingGroups = currentProject?.groups || [];
  return [
    ...existingGroups.map(group => {
      const name = getGroupName(group);
      return {
        label: name,
        value: name
      };
    }),
    { label: '+ Create New Group', value: '__create_new__' }
  ];
});

const contentTypeOptions = [
  { label: 'application/json', value: 'application/json' },
  { label: 'application/x-www-form-urlencoded', value: 'application/x-www-form-urlencoded' },
  { label: 'multipart/form-data', value: 'multipart/form-data' },
  { label: 'application/xml', value: 'application/xml' },
  { label: 'text/xml', value: 'text/xml' },
  { label: 'application/graphql', value: 'application/graphql' },
];

const form = reactive({
  endpoint: '',
  name: '',
  description: '',
  method: 'GET' as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  contentType: 'application/json' as 'application/json' | 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'application/xml' | 'text/xml' | 'application/graphql',
  statusMocks: [] as (StatusMock & { isCustom?: boolean })[],
  errorResponseObjectId: '',
  errorResponseValue: '',
  enabled: true,
  isAuth: false,
  isAdminEndpoint: false,
  group: '',
});

const showCreateGroupInput = ref(false);
const newGroupName = ref('');

watch(() => form.group, (newValue) => {
  if (newValue === '__create_new__') {
    showCreateGroupInput.value = true;
    form.group = '';
  }
});

const handleDescriptionInput = (event: Event) => {
  const target = event.target as HTMLDivElement;
  form.description = target.innerHTML;
};

const handleDescriptionBlur = (event: Event) => {
  const target = event.target as HTMLDivElement;
  form.description = target.innerHTML;
};

onMounted(async () => {
  await objectStore.fetchObjects();

  if (!isNew.value) {
    // For existing API, load it first and auto-select the project
    try {
      const api = await apiStore.fetchApi(route.params.id as string);

      // Auto-select the project from the API
      if (api.projectId) {
        projectStore.selectProject(api.projectId);
        // At least set the current project in the store
        const currentProject  = await projectStore.fetchProject(api.projectId);
        projectStore.setProjects([currentProject]);
      }

      Object.assign(form, {
        endpoint: api.endpoint,
        name: api.name || '',
        description: api.description || '',
        method: api.method,
        contentType: api.contentType || 'application/json',
        statusMocks: api.statusMocks.map((sm: StatusMock) => ({
          ...sm,
          isCustom: !commonStatusCodes.includes(sm.statusCode),
          headerParams: sm.headerParams || [],
          queryParams: sm.queryParams || [],
          bodyParams: sm.bodyParams || [],
          validators: (sm.validators || []).map((v: any) => {
            const parsed = parseValidatorRule(v.rule || '');
            return { field: v.field, type: parsed.type, value: parsed.value };
          }),
        })),
        errorResponseObjectId: api.errorResponseObjectId || '',
        errorResponseValue: api.errorResponseValue || '',
        enabled: api.enabled,
        isAuth: api.isAuth || false,
        isAdminEndpoint: api.isAdminEndpoint || false,
        group: api.group || '',
      });

      // Set the innerHTML of the contenteditable div
      nextTick(() => {
        if (descriptionEditor.value) {
          descriptionEditor.value.innerHTML = form.description;
        }
      });
    } catch (error) {
      console.error('Failed to load API:', error);
      // Show error modal if API doesn't exist
      errorMessage.value = 'API does not exist';
      showErrorModal.value = true;
    }
  } else {
    // For new API, check if a project is selected
    if (!projectStore.selectedProjectId) {
      showProjectSelector.value = true;
    }
  }
});

const addStatusMock = () => {
  // Add new status mock without changing enabled state of existing ones
  form.statusMocks.push({
    statusCode: 200,
    headerParams: [],
    queryParams: [],
    bodyParams: [],
    validators: [],
    responseObjectId: '',
    responseValue: '',
    enabled: form.statusMocks.length === 0 ? true : false,
    isCustom: false,
  });
};

const removeStatusMock = (index: number) => {
  form.statusMocks.splice(index, 1);
};

const toggleStatusMockEnabled = (index: number) => {
  if (form.statusMocks.length <= 1) {
    return;
  }
  // Only one status mock can be enabled at a time
  form.statusMocks.forEach((sm, i) => {
    sm.enabled = i === index ? !sm.enabled : false;
  });
};

const handleStatusChange = (index: number, value: string | number) => {
  if (value === 'custom') {
    form.statusMocks[index]!.isCustom = true;
    form.statusMocks[index]!.statusCode = 200;
  }
};

const addHeaderParam = (index: number) => {
  if (!form.statusMocks[index]!.headerParams) {
    form.statusMocks[index]!.headerParams = [];
  }
  form.statusMocks[index]!.headerParams!.push({ key: '', type: 'string', required: false });
};

const removeHeaderParam = (statusIndex: number, paramIndex: number) => {
  form.statusMocks[statusIndex]!.headerParams!.splice(paramIndex, 1);
};

const addQueryParam = (index: number) => {
  if (!form.statusMocks[index]!.queryParams) {
    form.statusMocks[index]!.queryParams = [];
  }
  form.statusMocks[index]!.queryParams!.push({ key: '', type: 'string', required: false });
};

const removeQueryParam = (statusIndex: number, paramIndex: number) => {
  form.statusMocks[statusIndex]!.queryParams!.splice(paramIndex, 1);
};

const addBodyParam = (index: number) => {
  if (!form.statusMocks[index]!.bodyParams) {
    form.statusMocks[index]!.bodyParams = [];
  }
  form.statusMocks[index]!.bodyParams!.push({ key: '', type: 'string', required: false });
};

const removeBodyParam = (statusIndex: number, paramIndex: number) => {
  form.statusMocks[statusIndex]!.bodyParams!.splice(paramIndex, 1);
};

const addValidator = (index: number) => {
  if (!form.statusMocks[index]!.validators) {
    form.statusMocks[index]!.validators = [];
  }
  (form.statusMocks[index]!.validators as any[]).push({ field: '', type: '', value: '' });
};

const removeValidator = (statusIndex: number, validatorIndex: number) => {
  form.statusMocks[statusIndex]!.validators!.splice(validatorIndex, 1);
};

const generateResponseValue = (index: number) => {
  const statusMock = form.statusMocks[index]!;
  if (!statusMock.responseObjectId) return;

  const selectedObject = objectStore.objects.find(obj => obj.id === statusMock.responseObjectId);
  if (!selectedObject) return;

  // Get the current project's access token
  const currentProject = projectStore.projects.find(p => p.id === projectStore.selectedProjectId);
  const projectAccessToken = currentProject?.accessToken;

  const objectsMap = new Map(objectStore.objects.map(obj => [obj.id, obj]));
  const mockData = generateMockData(selectedObject, objectsMap, 0, projectAccessToken);
  statusMock.responseValue = JSON.stringify(mockData, null, 2);
};

const handleResponseObjectChange = (index: number) => {
  const statusMock = form.statusMocks[index]!;
  if (statusMock.responseObjectId && !statusMock.responseValue) {
    generateResponseValue(index);
  }
};

const generateErrorResponseValue = () => {
  if (!form.errorResponseObjectId) return;

  const selectedObject = objectStore.objects.find(obj => obj.id === form.errorResponseObjectId);
  if (!selectedObject) return;

  // Get the current project's access token
  const currentProject = projectStore.projects.find(p => p.id === projectStore.selectedProjectId);
  const projectAccessToken = currentProject?.accessToken;

  const objectsMap = new Map(objectStore.objects.map(obj => [obj.id, obj]));
  const mockData = generateMockData(selectedObject, objectsMap, 0, projectAccessToken);
  form.errorResponseValue = JSON.stringify(mockData, null, 2);
};

const handleErrorResponseObjectChange = () => {
  if (form.errorResponseObjectId && !form.errorResponseValue) {
    generateErrorResponseValue();
  }
};

const beautifyResponseJson = (index: number) => {
  const statusMock = form.statusMocks[index]!;
  if (!statusMock.responseValue) return;

  try {
    const parsed = JSON.parse(statusMock.responseValue);
    statusMock.responseValue = JSON.stringify(parsed, null, 2);
  } catch (error) {
    toast.error('Invalid JSON format. Please check your JSON syntax.');
  }
};

const beautifyErrorResponseJson = () => {
  if (!form.errorResponseValue) return;

  try {
    const parsed = JSON.parse(form.errorResponseValue);
    form.errorResponseValue = JSON.stringify(parsed, null, 2);
  } catch (error) {
    toast.error('Invalid JSON format. Please check your JSON syntax.');
  }
};

const handleProjectSelectorClose = () => {
  showProjectSelector.value = false;
  router.push('/');
};

const handleProjectSelect = (projectId: string) => {
  projectStore.selectProject(projectId);
  showProjectSelector.value = false;
};

const handleErrorModalClose = () => {
  showErrorModal.value = false;
  router.push('/');
};

const createGroup = async () => {
  if (!newGroupName.value.trim()) return;

  const currentProject = projectStore.projects.find(p => p.id === projectStore.selectedProjectId);
  if (!currentProject) return;

  const existingGroups = currentProject.groups || [];
  if (existingGroups.includes(newGroupName.value.trim())) {
    toast.warning('Group already exists');
    return;
  }

  try {
    await projectStore.updateProject(currentProject.id, {
      ...currentProject,
      groups: [...existingGroups, newGroupName.value.trim()]
    });

    form.group = newGroupName.value.trim();
    newGroupName.value = '';
    showCreateGroupInput.value = false;
  } catch (error) {
    console.error('Failed to create group:', error);
    toast.error('Failed to create group');
  }
};

const cancelCreateGroup = () => {
  showCreateGroupInput.value = false;
  newGroupName.value = '';
  form.group = '';
};

const handleSubmit = async () => {
  console.log('Submitting form:', form);
  loading.value = true;
  try {
    if (!projectStore.selectedProjectId) {
      toast.warning('Please select a project first');
      loading.value = false;
      return;
    }

    if (form.statusMocks.length === 0) {
      toast.warning('Please add at least one status code configuration');
      loading.value = false;
      return;
    }

    const payload: any = {
      projectId: projectStore.selectedProjectId,
      endpoint: form.endpoint,
      name: form.name,
      description: form.description,
      method: form.method,
      contentType: form.contentType,
      statusMocks: form.statusMocks.map(sm => ({
        statusCode: sm.statusCode,
        headerParams: sm.headerParams?.filter(p => p.key) || [],
        queryParams: sm.queryParams?.filter(p => p.key) || [],
        bodyParams: sm.bodyParams?.filter(p => p.key) || [],
        validators: (sm.validators as any[])?.filter((v: any) => v.field && (v.value || v.type === 'email:')).map((v: any) => ({
          field: v.field,
          rule: buildValidatorRule(v.type || '', v.value || ''),
          message: '',
        })) || [],
        responseObjectId: sm.responseObjectId,
        responseValue: sm.responseValue,
        enabled: sm.enabled,
      })),
      errorResponseObjectId: form.errorResponseObjectId,
      errorResponseValue: form.errorResponseValue,
      enabled: form.enabled,
      isAuth: form.isAuth,
      isAdminEndpoint: form.isAdminEndpoint,
      group: form.group || undefined,
    };

    if (isNew.value) {
      // Get the max apiIndex for this project and add 1
      const projectApis = apiStore.apis.filter(a => a.projectId === projectStore.selectedProjectId);
      const maxIndex = projectApis.reduce((max, api) => {
        const index = api.apiIndex ?? -1;
        return index > max ? index : max;
      }, -1);
      payload.apiIndex = maxIndex + 1;

      await apiStore.createApi(payload);
    } else {
      await apiStore.updateApi(route.params.id as string, payload);
    }

    router.push('/');
  } catch (error) {
    console.error('Failed to save API:', error);
    toast.error('Failed to save API. Please check your input and try again.');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
[contenteditable][data-placeholder]:empty:before {
  content: attr(data-placeholder);
  color: #6b7280;
  pointer-events: none;
}

[contenteditable]:focus {
  outline: none;
}
</style>
