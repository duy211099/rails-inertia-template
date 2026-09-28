# frozen_string_literal: true

Warden::Manager.after_authentication do |user, warden, _opts|
  next unless warden.authenticated?(:user)

  AuthEvent.create!(
    user: user,
    email: user.email,
    event_type: :success,
    ip_address: warden.request.ip,
    user_agent: warden.request.user_agent
  )
end

Warden::Manager.before_failure do |env, opts|
  next unless opts[:scope] == :user

  request = ActionDispatch::Request.new(env)

  AuthEvent.create!(
    email: request.params.dig("user", "email"),
    event_type: :failure,
    ip_address: request.ip,
    user_agent: request.user_agent
  )
end
