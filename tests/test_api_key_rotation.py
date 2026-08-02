from __future__ import annotations

import unittest

from backend.framework.base.api_key_rotation import ApiKey, StickyApiKeyPool


class RetryableProviderError(RuntimeError):
    pass


class StickyApiKeyPoolTests(unittest.TestCase):
    def test_retryable_error_rotates_to_next_key(self) -> None:
        pool = StickyApiKeyPool(
            "Gemini",
            [
                ApiKey(slot=1, value="first-key"),
                ApiKey(slot=2, value="second-key"),
            ],
        )
        attempted_keys: list[str] = []

        def operation(api_key: str) -> str:
            attempted_keys.append(api_key)
            if api_key == "first-key":
                raise RetryableProviderError("429 quota exceeded")
            return "ok"

        result = pool.execute(
            operation,
            is_retryable=lambda exc: isinstance(exc, RetryableProviderError),
        )

        self.assertEqual(result, "ok")
        self.assertEqual(attempted_keys, ["first-key", "second-key"])
        self.assertEqual(pool.active_index, 1)


if __name__ == "__main__":
    unittest.main()
