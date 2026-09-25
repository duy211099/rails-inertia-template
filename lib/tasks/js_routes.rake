# frozen_string_literal: true

# js-routes emits valid declaration-file syntax, but some editor TypeScript
# diagnostics require the explicit `declare` keyword for uninitialized exports.
Rake::Task["js:routes"].enhance do
  declaration_file = Rails.root.join("app/frontend/lib/routes.d.ts")
  next unless declaration_file.file?

  source = declaration_file.read
  normalized = source.gsub(/^export const /, "export declare const ")
  normalized = normalized.gsub(/\n(export \{\};)/, "\n\n\\1")
  normalized = normalized.rstrip + "\n"
  declaration_file.write(normalized) unless normalized == source
end
