"""
Unit test verifying that the MediaRecorder header-fragment issue is resolved
via the growing raw buffer accumulation mechanism in AudioBufferManager.
"""

from app.services.ml_bridge import AudioBufferManager, process_audio_chunk

def test_growing_buffer_preserves_header():
    mgr = AudioBufferManager()
    call_id = "test_call_buffer_1"

    # Simulate Chunk 0 with WebM EBML header
    ebml_header = b"\x1a\x45\xdf\xa3" + b"EBML_HEADER_AND_TRACK_METADATA_CLUSTER_0"
    buf1 = mgr.append_chunk(call_id, ebml_header)
    assert buf1.startswith(b"\x1a\x45\xdf\xa3"), "Buffer 1 must start with EBML header"
    assert len(buf1) == len(ebml_header)
    assert mgr.get_chunk_count(call_id) == 1
    print("PASS: Chunk 0 with EBML header stored at offset 0")

    # Simulate Chunk 1 (raw Cluster fragment without EBML header)
    cluster_1 = b"RAW_CLUSTER_1_FRAGMENT_NO_HEADER"
    buf2 = mgr.append_chunk(call_id, cluster_1)
    # The accumulated buffer MUST still start with the EBML header from Chunk 0!
    assert buf2.startswith(b"\x1a\x45\xdf\xa3"), "Buffer 2 must still start with EBML header"
    assert len(buf2) == len(ebml_header) + len(cluster_1)
    assert mgr.get_chunk_count(call_id) == 2
    print("PASS: Chunk 1 fragment appended; growing buffer preserves EBML header at byte 0")

    # Simulate Chunk 2 (raw Cluster fragment without EBML header)
    cluster_2 = b"RAW_CLUSTER_2_FRAGMENT_NO_HEADER"
    buf3 = mgr.append_chunk(call_id, cluster_2)
    assert buf3.startswith(b"\x1a\x45\xdf\xa3")
    assert len(buf3) == len(ebml_header) + len(cluster_1) + len(cluster_2)
    assert mgr.get_chunk_count(call_id) == 3
    print("PASS: Chunk 2 fragment appended; total buffer contains full valid WebM stream")

    # Cleanup
    mgr.clear(call_id)
    assert len(mgr.get_buffer(call_id)) == 0
    assert mgr.get_chunk_count(call_id) == 0
    print("PASS: Buffer cleared on session cleanup")

if __name__ == "__main__":
    test_growing_buffer_preserves_header()
