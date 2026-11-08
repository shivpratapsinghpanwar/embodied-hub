from app.tagging import ALL_TAGS, infer_tags, normalize_tag


def test_vla_abstract_gets_domain_tags():
    text = (
        "We present a vision-language-action model that enables a robot arm to perform "
        "dexterous manipulation from camera images, trained with imitation learning on "
        "teleoperated demonstrations and fine-tuned in MuJoCo simulation."
    )
    tags = infer_tags(text)
    for expected in ("embodied-ai", "robotics", "manipulation", "computer-vision", "imitation-learning", "simulation"):
        assert expected in tags


def test_seed_tags_come_first_and_are_normalized():
    tags = infer_tags("nothing relevant here", seed_tags=["Robot Learning", "3D Reconstruction"])
    assert tags[:2] == ["robot-learning", "3d-reconstruction"]


def test_irrelevant_text_yields_no_taxonomy_tags():
    assert infer_tags("A recipe for sourdough bread with a long fermentation.") == []


def test_source_labels_map_onto_taxonomy_without_leaking():
    # Hugging Face pipeline tags and arXiv categories are passed as free text, not as tags.
    tags = infer_tags("some model image-segmentation object-detection cs.CV", seed_tags=["computer-vision"])
    assert "segmentation" in tags and "detection" in tags
    assert "image-segmentation" not in tags and "cs-cv" not in tags


def test_awesome_lists_are_flagged():
    assert "awesome-list" in infer_tags("Awesome-Embodied-AI: a curated list of papers")


def test_normalize_tag():
    assert normalize_tag("  Vision-Language Action!! ") == "vision-language-action"


def test_taxonomy_names_are_kebab_case():
    for tag in ALL_TAGS:
        assert tag == normalize_tag(tag)
